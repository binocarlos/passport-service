var hyperrequest = require('hyperrequest')

/*

  return a function pointing to an auth endpoint

  settings:
   * host - the hostname of the auth service (AUTH_SERVICE_HOST)
   * port - the port for the auth service (AUTH_SERVICE_PORT)
   * path - the path for the auth service (AUTH_SERVICE_PATH)

  the returned function is: fn(credentials, callback)

  credentials:

   * cookie - the cookie header passed by the client request

  if credentials is a string it is assumed to be:

  {
    cookie:<value>
  }
  
*/

function authenticator(settings){

  settings = settings || {}
  
  ['host', 'port', 'path'].forEach(function(key){
    if(!settings[key]) throw new Error(key + ' option required for auth/client')
  })
  
  return function(credentials, done){

    credentials = credentials || {}

    if(typeof(credentials)=='string'){
      credentials = {
        cookie:credentials
      }
    }
    hyperrequest({
      url: "http://" + settings.host + ":"+ settings.port + settings.path,
      method: "GET",
      headers:{
        'cookie':credentials.cookie,
        'Content-type':'application/json'
      }
    }, function(err, resp){

      if(err) return done(err.toString())

      done(null, resp.body)
    })
  }
}

module.exports = authenticator