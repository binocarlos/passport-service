const fs = require('fs')
const join = require('path').join
const express = require('express')
const passport = require('passport')
const mongoose = require('mongoose')

const Connection = require('./connection')

const config = require('./config/config')
const User = require('./app/models/user')

const PassportConfig = require('./config/passport')
const ExpressConfig = require('./config/express')
const Routes = require('./config/routes')

const port = config.port

module.exports = function(){
  const app = express()

  PassportConfig(passport)
  ExpressConfig(app, passport)
  Routes(app, passport)

  return {
    express:app,
    connect:function(mongo, done){
      Connection(mongoose, {
        mongo:mongo
      }, done)
    },
    disconnect:function(done){
      mongoose.disconnect(done)
    }
  }
}
