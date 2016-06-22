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
 * use in another node.js application

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

## routes

Once the HTTP server is up and listening - the following routes can be used:

 * GET /version
 * GET /status
 * GET /logout
 * POST /register
 * POST /login
 * POST /details

## tests

```bash
$ npm test
```

## license

MIT