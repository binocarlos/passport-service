'use strict';

/**
 * Module dependencies.
 */

const path = require('path');
const extend = require('util')._extend;
const utils = require('../utils')

function addsocial(name, config, scope){
  var upperName = name.toUpperCase()
  var id = process.env[upperName + '_CLIENTID']
  var secret = process.env[upperName + '_SECRET']
  if(!id || !secret) return
  var loginConfig = {
    clientID: id,
    clientSecret: secret,
    callbackURL: bind_scheme + '://' + bind_hostname + ':' + bind_port + bind_path + '/' + name + '/callback',
    scope: scope
  }
  config.auth[name] = loginConfig
}

// used for oauth callback urls
// base_hostname + base_path
// mysite/auth
const bind_scheme = utils.getenv('SCHEME', 'http')
const bind_hostname = utils.getenv('HOSTNAME', null, {
  required:true
})
const bind_port = utils.getenv('PORT', 80)
const bind_path_v1 = utils.getenv('MOUNT_PATH', '/v1/auth')

// the paths to use for redirection
const success_redirect = utils.getenv('SUCCESS_REDIRECT', '/')
const failure_redirect = utils.getenv('FAILURE_REDIRECT', '/login')

// encrypt the session cookie
const cookiesecret = utils.getenv('COOKIE_SECRET', 'apples')

// secret for service token encoding
const tokensecret = utils.getenv('TOKEN_SECRET', 'oranges')

// settings for mongo connection
const mongohost = utils.getenv('MONGO_SERVICE_HOST', null, {
  required:true
})
const mongoport = utils.getenv('MONGO_SERVICE_PORT', 27017)
const mongodb = utils.getenv('MONGO_SERVICE_DB', 'auth')

var config = {
  port:bind_port,
  root: path.resolve(path.join(__dirname, '..')),
  cookiesecret,
  tokensecret,
  bind_scheme,
  bind_port,
  bind_hostname,
  bind_path_v1,
  mongo: utils.mongoConnectionString(mongohost, mongoport, mongodb),
  mongohost,
  mongoport,
  mongodb,
  success_redirect,
  failure_redirect,
  auth:{}
}

/*
addsocial('facebook', config, [
  'email',
  'user_about_me'
])
addsocial('google', config, [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
])
addsocial('twitter', config)
addsocial('github', config)
*/

module.exports = config
