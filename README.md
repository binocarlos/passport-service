# passport-service

Toolkit for authenticating users and micro-services.

Uses [passport](https://github.com/jaredhanson/passport) and Mongo for backend storage for user sessions.

Provides a library of functions to enable JWT access for micro-services.

## install

the node library for your app:

```bash
$ npm install passport-service
```

the auth service as a docker container:

```bash
$ docker pull binocarlos/passport-service
```

## auth service
A HTTP authentication service for user registrations/logins.

You can run the auth service in a few different ways:

 * Docker container
 * stand alone node.js application
 * use in another node.js application (tbc)

## options
The following table shows the command-line flag, environment variable and config property for each setting of the auth service.

Name | CLI | ENV | Field | Required | Default
--- | --- | --- | --- | --- | ---
Scheme | --scheme | SCHEME | bind_scheme | | http
Hostname | --hostname | HOSTNAME | bind_hostname | yes |
Port | --port | PORT | bind_port | | 80
Mount Path | --mount-path | MOUNT_PATH | bind_path_v1 | | /v1/auth
Success Redirect | --success-redirect | SUCCESS_REDIRECT | success_redirect | | /
Failure Redirect | --failure-redirect | FAILURE_REDIRECT | failure_redirect | | /login
Cookie Secret | --cookie-secret | COOKIE_SECRET | cookiesecret | | apples
Token Secret | --token-secret | TOKEN_SECRET | tokensecret | | oranges
Mongo Host | --mongo-host | MONGO_SERVICE_HOST | mongohost | yes | 
Mongo Port | --mongo-port | MONGO_SERVICE_PORT | mongoport | | 27017
Mongo DB | --mongo-db | MONGO_SERVICE_DB | mongodb | | auth

#### docker container

First run a basic Mongo container:

```bash
$ docker run -d \
  --name mongo \
  mongo
```

Then link the auth container to it:

```bash
$ docker run -d \
  -p 80:80 \
  --link mongo:mongo \
  -e HOSTNAME=172.17.1.168 \
  -e MONGO_SERVICE_HOST=mongo \
  binocarlos/passport-service
```

#### stand alone node.js application

```bash
$ node index.js \
  --hostname=myapp.local \
  --mongo-host=mongo.local
```

#### use in another node.js application

```javascript
var http = require('http')
var passportService = require('passport-service')

var authHandler = passportService({
  hostname:'myapp.local',
  mongo_host:'mongo.local'
})

// you can use any server framework here (e.g. express or hapi)
var server = http.createServer(function(req, res){
  if(req.url.indexOf('/v1/auth')==0){
    authHandler(req, res)
  }
  else{
    res.end('my app')
  }
})
```

NOTE - this needs to be completed still

## routes

Once the HTTP server is up and listening - the following routes can be used:

 * GET /version
 * GET /status
 * GET /logout
 * POST /register
 * POST /login
 * POST /details

#### `GET /version`

Returns `text/plain` with the semver of the current package.

#### `GET /status`

Returns `application/json` with the user details for the cookie/token passed in the request.

```javascript
{
  "loggedIn": true,
  "user": {
    "_id": "576bce9a1218f30100379b96",
    "__v": 0,
    "provider": "local",
    "username": "",
    "email": "g@g.com",
    "type": "user",
    "name": ""
  }
}
```

#### `GET /logout`

Removes the session token and redirects the user to `/`

#### `POST /register`

POST `application/json`:

```javascript
{
  email:'bob@bob.com',
  password:'apples'
}
```

Returns `application/json`:

```javascript
{
  "registered": true,
  "user": {
    "_id": "576bce9a1218f30100379b96",
    "__v": 0,
    "provider": "local",
    "username": "",
    "email": "g@g.com",
    "type": "user",
    "name": ""
  }
}
```

#### `POST /login`

POST `application/json`:

```javascript
{
  email:'bob@bob.com',
  password:'apples'
}
```

Returns `application/json`:

```javascript
{
  "loggedIn": true,
  "user": {
    "_id": "576bce9a1218f30100379b96",
    "__v": 0,
    "provider": "local",
    "username": "",
    "email": "g@g.com",
    "type": "user",
    "name": ""
  }
}
```

#### `POST /details`

The user schema has a `data` property that is a POJO with whatever fields you want.

Whatever JSON packet you POST to `/details` will be written to the `data` property of the user:

POST `application/json`:

```javascript
{
  "fruit":"apples",
  "color":"red"
}
```

Returns `application/json`:

```javascript
{
  "updated": true,
  "user": {
    "_id": "576bce9a1218f30100379b96",
    "__v": 0,
    "provider": "local",
    "username": "",
    "email": "g@g.com",
    "type": "user",
    "name": "",
    "data":{
      "fruit":"apples",
      "color":"red"
    }
  }
}
```

## token access

You can use this library to protect micro-services with JWT token access.

You will need a shared secret between the micro-service and clients that want to speak to it.

#### server-side

Here is an example of protecting a route using the token access:

```javascript
const Access = require('passport-service/tokenaccess')

// the shared secret
const secret = process.env.TOKEN_SECRET

// we want to protect this handler with JWT tokens
var handler = function(req, res){
  res.end('sensitive data')
}

// this is the protected handler we can serve over the wire
var wrappedHandler = Access({
  secret:secret,

  /*

    this gives us a chance to implement our own authorization logic
    authData is the context of the request
    it has a 'context' property either 'token' or 'session'
    if the context is neither of these then the request is not authenticated

   */

  authorizor:function(req, authData, done){

    /*

      'authData.context' has to be either:
        * session access with user
        * token access with user_id in tokenData

     */

    if(authData.context=='token'){

      /*

        authData.data contains the data encoded into the token
        we can use it to decide on access
        the point is you can do what you want in this function
        also it is async so you can lookup files/network to determine access

       */

      var tokenData = authData.data

      if(tokenData.serviceType=='apples'){

        // return no error means the request can proceed
        done()
      }
      else{

        // return an error blocks the request
        done('access denied to service: ' + tokenData.serviceType)
      }
      
    }
    else{

      // return an error blocks the request
      return done('token access needed for frameworks service', 'authn')
    }
  }
}, router)
```

#### client-side

Here is an example of making a request to the service above:

```javascript
const request = require('request')
const authTools = require('passport-service/tools')

// the shared secret
const secret = process.env.TOKEN_SECRET

// the data we want to inject into the token
var tokenData = {
  serviceType:'apples'
}

// other headers we want to send
var headers = {
  'X-MY-HEADER':'apples'
}

request({
  method:'GET',
  url:'http://myservice.local/v1/path',
  headers:authTools.injectToken(secret, tokenData, headers)
}, function(err res){
  // handle the response
})
```

The above will inject a JWT into the request headers using the secret you pass.

## session access

You can also use this library to protect a micro-service using session based user logins.

#### server-side

Here is an example of protecting a route using the session access:

```javascript
const Access = require('passport-service/tokenaccess')

// the shared secret
const secret = process.env.TOKEN_SECRET

// the connection details for our auth endpoint
const auth_host = 'myauthservice.local'
const auth_port = 80
const auth_path = '/v1/auth'

// we want to protect this handler with JWT tokens
var handler = function(req, res){
  res.end('sensitive data')
}

// this is the protected handler we can serve over the wire
var wrappedHandler = Access({
  secret:secret,

  /*

    the same as token access but this time the context may be set to 'session'
    in this handler we set the `_userid` property of the request to match the user in the request
    this can be got from either the session cookie or the token

   */

  authorizor:function(req, authData, done){

    if(authData.context=='token'){
        if(!authData.data || !authData.data.userid){
          return done('user needed for projects service', 'authn')
        }
        req._userid = authData.data.userid
        done()
      }
      else if(authData.context=='session'){
        if(!authData.data || !authData.data.loggedIn || !authData.data.user || !authData.data.user._id){
          return done('user needed for projects service', 'authn')
        }
        req._userid = authData.data.user._id
        done()
      }
      else{
        return done('user needed for projects service', 'authn')
      }
  }
}, router)
```

#### client-side

For session access any client that can use cookies can make requests (e.g. a browser or the `request` module using `cookie-jar=true`)

Obviously that client must have made a request to `/v1/auth/login` to get the cookie before making requests to protected routes.

## tests

```bash
$ npm test
```

## license

MIT