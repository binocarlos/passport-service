var async = require('async')
var httpTools = require('./http')
var jwt = require('jsonwebtoken')
var tools = require('./tools')

/*

---------------------------------------------

  wrap a http handler with jwt token based access control

  this is used for service endpoints that will be contacted
  by other services (for example /v1/config/private)

  the token access is controlled by a secret - the same secret
  must be passed to the 'injecttoken' module when speaking to
  a token based access control endpoint

  opts:

   * secret - the secret (usually passed as an env var)
   * authorizor(req, {
      context:'token',
      data:{
        tokenContents...
      }
     }, function(err, accessData){
  
     })

  handler - the pure fn(req, res) for the handler - called with original args
  
  req.token and req.accessData are populated if given
*/

function tokenAccessControl(opts, handler){

  opts = opts || {}

  if(!opts.secret){
    throw new Error('secret option needed for tokenAccessControl')
  }

  if(typeof(handler)!=='function'){
    throw new Error('you must pass a handler to tokenAccessControl')
  }

  // a user supplied function that will be provided with the
  // result of the token decoding
  var authorizor = opts.authorizor || function(req, data, done){ done() }

  return function(req, res){

    // grab the full args from the router (can be req,res,opts,cb)
    var handlerArgs = Array.prototype.slice.call(arguments)

    tools.extractToken(opts.secret, req.headers, function(err, data){
      if(err) data = null

      // authorize the user (even if we don't have on it's up to the authz fn)
      authorizor(req, {
        context:data ? 'token' : null,
        // we send the contents of the JWT token to the authorizer
        data:data
      }, function(err, access){

        if(err) return tools.handleNoUser(res, err)

        // TODO look at access and decide if to issue a tools.handleNoAccess
        handler.apply(null, handlerArgs)

      })
    })
    
  }
}

module.exports = tokenAccessControl