'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const TwitterStrategy = require('passport-twitter').Strategy;
const config = require('../config');
const User = mongoose.model('User');

/**
 * Expose
 */

module.exports = new TwitterStrategy({
    consumerKey: config.auth.twitter.clientID,
    consumerSecret: config.auth.twitter.clientSecret,
    callbackURL: config.auth.twitter.callbackURL
  },
  function (accessToken, refreshToken, profile, done) {
    const options = {
      criteria: { 'twitter.id': profile.id }
    };
    User.load(options, function (err, user) {
      if (err) return done(err);
      if (!user) {
        user = new User({
          name: profile.displayName,
          username: profile.username,
          provider: 'twitter',
          twitter: profile._json
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
