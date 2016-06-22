var async = require('async')
var httpTools = require('./http')
var authTools = require('./tools')
var sessionClient = require('./sessionclient')

/*

---------------------------------------------

  wrap a http handler with session cookie based access control

  this means contacting the auth server
  and writing the results to req.user

  handler: the function(req, res) to call
  if the authn/authz succeeds

  opts:

   * host,port,path - passed to the sessionClient
   * authorizor(req, {
      context:'session',
      loggedIn:{true,false},
      data:{
        loginPacket...
      }
     }, function(err, accessData){
  
     })


  req.user and req.accessData are populated if given
*/

function errorHandler(res, message){
  res.statusCode = 401
  res.setHeader('Content-type', 'text/plain')
  res.end(message || 'there was an error with the session login')
}

function sessionAccessControl(opts, handler){

  opts = opts || {}
  
  if(typeof(handler)!=='function'){
    throw new Error('you must pass a handler to sessionAccessControl')
  }

  // a user supplied function that will be provided with the
  // result of the authenticator
  var authorizor = opts.authorizor || function(req, data, done){ done() }

  // are we allowing any request through even if there is now user?
  var openAccess = opts.openAccess ? true : false

  // this will look after checking for host,port and path
  // it is a HTTP client to the auth service to resolve the cookie
  // into a user
  var authClient = sessionClient(opts)

  return function(req, res){

    // grab the full args from the router (can be req,res,opts,cb)
    var handlerArgs = Array.prototype.slice.call(arguments)

    // contact the auth service to turn the cookie into a user
    // this uses the sessionClient
    authClient({
      cookie:req.headers.cookie
    }, httpTools.errorWrapper(res, function(loginPacket){

      if(!loginPacket) return authTools.handleError(res, 'no login packet returned')

      // authorize the user (even if we don't have on it's up to the authz fn)
      authorizor(req, {
        context:'session',
        // we send the results from /v1/auth/status to the authorizer
        data:loginPacket
      }, function(err, access){

        if(err){
          
          if(access=='authz'){
            return authTools.handleNoAccess(res, err)
          }
          // default to assuming its a no user error
          else{
            return authTools.handleNoUser(res, err)
          }
        }

        handler.apply(null, handlerArgs)

      })
      
    }))
    
  }
}

module.exports = sessionAccessControl