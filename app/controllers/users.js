'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const User = mongoose.model('User');
const config = require('../../config/config');
const passport = require('passport');
const httputils = require('../../http')
const authtools = require('../../tools')

/*

  middleware
  
*/
function loadUser(id, done) {
  User.findById(id, function(err, profile){
    if(err || !profile) return done('User not found')
    done(null, profile)
  })
}

/*

  local user register
  
*/
exports.register = function(req, res) {
  const user = new User(req.body);
  user.provider = 'local';
  user.save(function(err){
    if(err) return authtools.handleError(res, err)
    
    res.json({
      registered:true,
      user:user.toObject()
    })
  })
}

/*

  login user
  
*/
exports.login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) return authtools.handleError(res, err)
    if (!user) return authtools.handleNoUser(res)

    req.login(user, function(err) {
      if (err) return authtools.handleError(res, err)

      return res.json({
        loggedIn:true,
        user:user
      })
    })
  })(req, res, next)
}

// get info for the user
exports.status = function (req, res) {
  if(!req.user) return authtools.handleNoUser(res)
  
  loadUser(req.user._id, function(err, profile){
    if(err) return authtools.handleError(res, err)

    var sendProfile = JSON.parse(JSON.stringify(profile))

    delete(sendProfile.salt)
    delete(sendProfile.hashed_password)
    delete(sendProfile.authToken)
      
    res.json({
      loggedIn:true,
      user:sendProfile
    })

  })
}


// get info for the user
exports.details = function (req, res) {

  if(!req.user) return authtools.handleNoUser(res)

  var data = req.body
  
  loadUser(req.user._id, function(err, profile){
    if (err) return authtools.handleError(res, err)
    profile.set({
      data:data
    })
    profile.save(function(err, newdata){
      if (err) return authtools.handleError(res, err)
      res.json({
        updated:true,
        user:profile
      })
    })
  })
  
}

// a noop because this will redirect to the
// oauth provider
exports.noop = function (req, res) {}

// redirect the browser to the configured success url
exports.redirect = function (req, res) {
  const redirectTo = req.session.returnTo
    ? req.session.returnTo
    : config.success_redirect
  delete req.session.returnTo
  res.redirect(redirectTo)
}

// clear the session
exports.logout = function (req, res) {
  req.logout()
  delete req.session
  res.redirect('/')
}
