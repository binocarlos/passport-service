'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const GithubStrategy = require('passport-github').Strategy;
const config = require('../config');
const User = mongoose.model('User');

/**
 * Expose
 */

module.exports = new GithubStrategy({
    clientID: config.auth.github.clientID,
    clientSecret: config.auth.github.clientSecret,
    callbackURL: config.auth.github.callbackURL
  },
  function (accessToken, refreshToken, profile, done) {
    const options = {
      criteria: { 'github.id': profile.id }
    };
    User.load(options, function (err, user) {
      if (err) return done(err);
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          username: profile.username,
          provider: 'github',
          github: profile._json
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
