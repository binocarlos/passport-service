'use strict';

/*!
 * Module dependencies.
 */

const mongoose = require('mongoose');
const User = mongoose.model('User');

const config = require('./config');
const local = require('./passport/local');


/**
 * Expose
 */

module.exports = function (passport) {

  // serialize sessions
  passport.serializeUser((user, cb) => cb(null, user.id));
  passport.deserializeUser((id, cb) => User.findById(id, cb));

  // use these strategies
  passport.use(local);

  // loop the social logins and add the ones
  // we have env vars for
  Object.keys(config.auth || {}).forEach(function(key){
    passport.use(require('./passport/' + key))
  })
}
