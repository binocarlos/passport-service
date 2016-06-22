var tokenAccess = require('./tokenaccess')
var sessionAccess = require('./sessionaccess')
var tokenTools = require('./tools')

/*

  a wrapper around both types of access that decides which to use
  based on the presence of a token or cookie

*/

function errorHandler(res, message){
  res.statusCode = 401
  res.setHeader('Content-type', 'text/plain')
  res.end(message || 'there was an error with the session login')
}

function accessControl(opts, handler){

  opts = opts || {}

  // we defer error handler for options to each of the modules
  // and assume that opts is a mashup of both option sets
  // in both modules will use opts.authorize in the same way
  var tokenHandler = tokenAccess(opts, handler)
  var sessionHandler = sessionAccess(opts, handler)

  return function(req, res){

    // grab the full args from the router (can be req,res,opts,cb)
    var handlerArgs = Array.prototype.slice.call(arguments)

    // branch based on if we have a token or not
    if(tokenTools.hasToken(req.headers)){
      tokenHandler.apply(null, handlerArgs)
    }
    else{
      sessionHandler.apply(null, handlerArgs)
    }
    
  }
}

module.exports = accessControl