const tape = require('tape')
const async = require('async')
const realRequest = require('request')
const mongoose = require('mongoose')
const mockgoose = require('mockgoose')
const http = require('http')
const mockServer = require('./mockauthserver')
const authHelpers = require('./testcases')

process.env.HOSTNAME = '127.0.0.1'
process.env.MONGO_SERVICE_HOST = '127.0.0.1'

const App = require('./app')
const config = require('./config/config')

const TEST_PORT = process.env.TEST_PORT || 8188
const MOCK_TEST_PORT = process.env.MOCK_TEST_PORT || 8189

const fixtures = {
  email:'bob@bob.com',
  password:'apples'
}

var state = {}
var mockstate = {}

function request(opts, done){
  opts = opts || {}
  opts.headers = opts.headers || {}

  opts.headers['Cookie'] = state.cookieString

  return realRequest(opts, done)
}

function getURL(path){
  return 'http://127.0.0.1:' + TEST_PORT + config.bind_path_v1 + path
}

function getMockURL(path){
  return 'http://127.0.0.1:' + MOCK_TEST_PORT + config.bind_path_v1 + path
}

function errorWrapper(t, fn){
  return function(err, data){
    if(err){
      t.error(err)
      return t.end()
    }
    fn(data)
  }
}

var app, server, mockapp, mockserver

var hooks = {
  setup: function(t) {
    mockgoose(mongoose).then(function() {
 
      mongoose.connect('mongodb://' + process.env.MONGO_SERVICE_HOST + '/TestingDB', function(err) {
        app = App()
        server = app.express.listen(TEST_PORT, function(){
          t.pass('server listening on port: ' + TEST_PORT, 'server listening')

          mockapp = mockServer()
          mockserver = http.createServer(mockapp)

          mockserver.listen(MOCK_TEST_PORT, function(){
            t.pass('mock server listening on port: ' + MOCK_TEST_PORT, 'mock server listening')
            t.end()
          })
          
        })
      })
    })
  },
  teardown: function(t) {
    mongoose.unmock(function() {
      server.close(function(){
        mockserver.close(function(){
          mongoose.disconnect(function(){
            t.pass('server closed', 'closing server')
            t.end()
          })
        })
      })
      
    })
  }
}

var testapi = authHelpers.factory({
  tape:tape,
  request:request,
  email:fixtures.email,
  password:fixtures.password,
  state:state
}, {
  checkNoLogin:getURL('/status'),
  checkHasLogin:getURL('/status'),
  doLogin:getURL('/login'),
  doLogout:getURL('/logout'),
  checkDetails:{
    url:getURL('/details'),
    statusurl:getURL('/status')
  },
  checkSignup:getURL('/register')
})

var mockapi = authHelpers.factory({
  tape:tape,
  request:request,
  email:fixtures.email,
  password:fixtures.password,
  state:mockstate
}, {
  checkNoLogin:getMockURL('/status'),
  checkHasLogin:getMockURL('/status'),
  doLogin:getMockURL('/login'),
  doLogout:getMockURL('/logout'),
  checkDetails:{
    url:getMockURL('/details'),
    statusurl:getMockURL('/status')
  },
  checkSignup:getMockURL('/register')
})

tape('can get setup', function (t) {
  hooks.setup(t)
})

tape('can read /version', function (t) {

  var pkg = require('./package.json')
  var url = getURL('/version')

  request({
    url:getURL('/version'),
    method:'GET'
  }, errorWrapper(t, function(res){

    t.equal(res.body.match(/^\d+\.\d+\.\d+$/) ? true : false, true, 'the version is a semver')
    t.equal(res.body, pkg.version, 'the versions are the same')

    t.end()
  }))
})


/*

  the actual test sequence
  
*/

testapi.fullSuite({
  title:'authapi'
})
mockapi.fullSuite({
  title:'mockapi'
})

/*

  this is a horrible hack but I cannot seem to get the teardown of the final
  test to happen and the test just hangs there

  100 points for whoever can work out why
  (having spent a few hours already I am not worthy of those points)
  
*/
tape('can shutdown', function(t){
  t.ok('shutting down', 'shutting down')
  hooks.teardown(t)
  
  // let the test ack that it has finished before process.exiting
  setTimeout(function(){
    process.exit(0)
  },10)
  
})