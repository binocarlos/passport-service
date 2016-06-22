var concat = require('concat-stream')

/*

  various http utilities
  
*/

function sendError(res, err){
  res.statusCode = 500
  res.setHeader('content-type', 'text/plain')
  res.end(err.toString())
}

// send JSON to a http res
function sendJSON(res, data, opts){
  opts = opts || {}
  res.statusCode = opts.statusCode || 200
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(data))
}

// grab / parse JSON from a req stream
function pipeJSON(req, done){
  req.pipe(concat(function(body){
    try{
      body = JSON.parse(body.toString())
    } catch (e){
      return done(e.toString())
    }
    done(null, body)
  }))
}

// wrap a function and if it gets and error
// send a statusCode 500 and the error to the http res
function errorWrapper(res, fn){
  return function(err, data){
    if(err) return sendError(res, err)
    fn(data)
  }
}

function pipeJSONError(req, res, done){
  pipeJSON(req, errorWrapper(res, done))
}

function notAuthorized(res){
  res.statusCode = 401
  res.end('not authorized')
}

function forbidden(res){
  res.statusCode = 403
  res.end('forbidden')
}

module.exports = {
  sendJSON,
  pipeJSON,
  sendError,
  pipeJSONError,
  errorWrapper,
  notAuthorized,
  forbidden
}