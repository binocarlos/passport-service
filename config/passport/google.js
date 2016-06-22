'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const config = require('../config');
const User = mongoose.model('User');

/**
 * Expose
 */

module.exports = new GoogleStrategy({
    clientID: config.auth.google.clientID,
    clientSecret: config.auth.google.clientSecret,
    callbackURL: config.auth.google.callbackURL
  },
  function (accessToken, refreshToken, profile, done) {
    const options = {
      criteria: { 'google.id': profile.id }
    };
    User.load(options, function (err, user) {
      if (err) return done(err);
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          username: profile.username,
          provider: 'google',
          google: profile._json
        });
        user.save(function (err) {
          if (err) console.log(err);
          return done(err, user);
        });
      } else {
        return done(err, user);
      }
    });
  }
);
