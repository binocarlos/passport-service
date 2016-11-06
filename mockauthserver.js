var HttpHashRouter = require('http-hash-router')
var http = require('http')
var httpTools = require('./http')
var authtools = require('./tools')
var hat = require('hat')

/*

  a mock auth server that can be used in unit tests of services

  it keeps internal state in memory
  
*/

module.exports = function(opts){
  opts = opts || {}

  var router = HttpHashRouter()

  var registeredUser = null
  var currentUser = null

  router.set('/auth/v1/status', {
    GET:function(req, res){
      if(!currentUser) return authtools.handleNoUser(res)
      httpTools.sendJSON(res, {
        loggedIn:true,
        user:currentUser
      })
    }
  })

  router.set('/auth/v1/logout', {
    GET:function(req, res){
      currentUser = null
      res.statusCode = 302
      res.setHeader('Location', '/')
      res.end()
    }
  })

  router.set('/auth/v1/register', {
    POST:function(req, res){
      httpTools.pipeJSON(req, function(err, data){
        if (err) return authtools.handleError(res, err)
        data._id = hat()
        registeredUser = data
        httpTools.sendJSON(res, {
          registered:true,
          user:registeredUser
        })
      })
    }
  })

  router.set('/auth/v1/login', {
    POST:function(req, res){
      httpTools.pipeJSON(req, function(err, data){
        if (err) return authtools.handleError(res, err)

        if(registeredUser && data.email==registeredUser.email && data.password==registeredUser.password){
          currentUser = registeredUser
          httpTools.sendJSON(res, {
            loggedIn:true,
            user:currentUser
          })
        }
        else{
          authtools.handleNoUser(res)
        }
        
      })
    }
  })

  router.set('/auth/v1/details', {
    POST:function(req, res){
      httpTools.pipeJSON(req, function(err, data){
        if (err) return authtools.handleError(res, err)
        if(!currentUser) return authtools.handleNoUser(res)
        currentUser.data = data
        httpTools.sendJSON(res, {
          updated:true,
          user:currentUser
        })
        
      })
    }
  })

  function handler(req, res) {

    function onError(err) {
      if (err) {
        res.statusCode = err.statusCode || 500;
        res.end(err.message);
      }
    }

    console.log('mock: ' + req.method + ' ' + req.url)

    router(req, res, {}, onError)
  }

  handler.addID = function(user){
    if(user._id) return
    user._id = hat()
  }
  handler.quickRegister = function(user){
    registeredUser = user
  }
  handler.quickLogin = function(user){
    currentUser = user
  }
  handler.quickLogout = function(){
    currentUser = null
  }
  handler.quickSetup = function(user){
    this.addID(user)
    this.quickRegister(user)
    this.quickLogin(user)
  }

  return handler
}