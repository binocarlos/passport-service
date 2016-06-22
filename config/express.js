'use strict';

/**
 * Module dependencies.
 */

const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');

const mongoStore = require('connect-mongo')(session);
const config = require('./config');

const env = process.env.NODE_ENV || 'development';

/**
 * Expose
 */

module.exports = function (app, passport) {

  if (env !== 'test'){
    app.use(morgan('combined'))
  }

  // bodyParser should be above methodOverride
  app.use(bodyParser.json());

  // CookieParser should be above session
  app.use(cookieParser());
  app.use(cookieSession({ secret: config.cookiesecret }));

  // the session middleware
  app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: config.cookiesecret,
    store: new mongoStore({
      url: config.mongo,
      collection : 'sessions'
    })
  }));

  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());
};
