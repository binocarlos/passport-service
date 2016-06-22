var utils = require('./testcaseutils')
/*

  standard tests against the auth API

  used in the auth unit tests and overall acceptance tests
  
*/
var standardOpts = ['tape', 'request']
var standardFns = {
  checkNoLogin:checkNoLogin,
  checkHasLogin:checkHasLogin,
  doLogin:doLogin,
  doLogout:doLogout,
  checkDetails:checkDetails,
  checkSignup:checkSignup
}

var checkOpts = utils.checkOpts
var getTestTitle = utils.getTestTitle

/*

  check that there is no current login
  
*/
function checkNoLogin(opts){
  opts = opts || {}
  checkOpts(opts, standardOpts.concat(['url']))

  opts.tape(getTestTitle('no login for /v1/auth/status', opts), function (t) {

    opts.request({
      url:opts.url,
      method:'GET',
      json:true
    }, function(err, res){
      if(err){
        t.error(err)
        return t.end()
      }

      t.equal(res.statusCode, 401, 'the status code is 200')
      t.equal(res.body.loggedIn, false, 'loggedIn is false')
      t.equal(res.body.message, 'not logged in', 'error message is set')

      t.end()
    })
  })
}

/*

  check there is a login for 'opts.email'
  write the user to 'opts.state'
  
*/
function checkHasLogin(opts){
  opts = opts || {}
  checkOpts(opts, standardOpts.concat(['url', 'email', 'state']))

  opts.tape(getTestTitle('has login for /v1/auth/status', opts), function (t) {

    opts.request({
      url:opts.url,
      method:'GET',
      json:true
    }, function(err, res){
      if(err){
        t.error(err)
        return t.end()
      }

      t.equal(res.statusCode, 200, 'the status code is 200')
      t.equal(res.body.loggedIn, true, 'user is loggedIn')
      t.equal(res.body.user ? res.body.user.email : '', opts.email, 'the email is the same')

      opts.state.user = res.body.user

      t.end()
    })
  })
}

/*

  execute a login using:

  * opts.email
  * opts.password

  write the login result to 'opts.state'
  
*/
function doLogin(opts){
  opts = opts || {}
  checkOpts(opts, standardOpts.concat(['url', 'email', 'password', 'state']))

  opts.tape(getTestTitle('can login to /v1/auth/login', opts), function (t) {

    opts.request({
      url:opts.url,
      method:'POST',
      json:true,
      body:{
        email:opts.email,
        password:opts.password
      }
    }, function(err, res){
      if(err){
        t.error(err)
        return t.end()
      }

      t.equal(res.statusCode, 200, 'the status code is 200')
      t.equal(res.body.loggedIn, true, 'user is loggedIn')
      t.equal(res.body.user.email, opts.email, 'the email is the same')

      opts.state.user = res.body.user
      opts.state.userid = res.body.user._id

      var cookies = res.headers['set-cookie'] || []

      opts.state.cookieString = cookies.map(function(cookie){
        return cookie.split(';')[0]
      }).join(';')

      t.end()
    })
  })
}

/*

  do a logout request
  blank opts.state.user
  
*/
function doLogout(opts){
  opts = opts || {}
  checkOpts(opts, standardOpts.concat(['url', 'state']))

  opts.tape(getTestTitle('can logout at /v1/auth/logout', opts), function (t) {

    opts.request({
      url:opts.url,
      method:'GET',
      json:true,
      followRedirect:false
    }, function(err, res){
      if(err){
        t.error(err)
        return t.end()
      }

      t.equal(res.statusCode, 302, 'the redirect')
      opts.state.user = null
      opts.state.userid = null
      opts.state.cookieString = null
      t.end()
    })
  })
}

/*

  post to details and check the status

  opts.url -> details
  opts.statusurl -> status
  
*/
function checkDetails(opts){
  opts = opts || {}
  checkOpts(opts, standardOpts.concat(['url', 'statusurl']))

  opts.tape(getTestTitle('can POST /v1/auth/details', opts), function (t) {

    opts.request({
      url:opts.url,
      method:'POST',
      json:true,
      body:{
        city:'london',
        color:'green'
      }
    }, function(err, res){
      if(err){
        t.error(err)
        return t.end()
      }

      t.equal(res.statusCode, 200, '200 status')
      t.equal(res.body.updated, true, 'updated is true')
      t.equal(res.body.user.data.city, 'london', 'the value is saved')
      
      t.end()
    })
  })

  opts.tape(getTestTitle('can GET details from /v1/auth/status', opts), function (t) {

    opts.request({
      url:opts.statusurl,
      method:'GET',
      json:true
    }, function(err, res){
      if(err){
        t.error(err)
        return t.end()
      }

      t.equal(res.statusCode, 200, '200 status')
      t.equal(res.body.user.data.city, 'london', 'the value is saved')
      
      t.end()
    })
  })
}

/*

  check we can register with:

   * opts.email
   * opts.password
  
*/
function checkSignup(opts){
  opts = opts || {}
  checkOpts(opts, standardOpts.concat(['url', 'email', 'password']))

  opts.tape(getTestTitle('can signup to /v1/auth/register', opts), function (t) {

    opts.request({
      url:opts.url,
      method:'POST',
      json:true,
      body:{
        email:opts.email,
        password:opts.password
      }
    }, function(err, res){
      if(err){
        t.error(err)
        return t.end()
      }

      t.equal(res.statusCode, 200, 'the status code is 200')
      t.equal(res.body.registered, true, 'user is loggedIn')
      t.equal(res.body.user.email, opts.email, 'the email is the same')

      t.end()
    })
  })
}

/*

  a way of building the whole api using one set of options
  a shortcut really - you can still use each test function on its own
  
*/
function factory(opts, overrides){
  opts = opts || {}
  overrides = overrides || {}
  checkOpts(opts, standardOpts.concat(['email', 'password', 'state']))
  checkOpts(overrides, Object.keys(standardFns || {}))

  var ret = {}

  Object.keys(standardFns || {}).forEach(function(key){
    var fn = standardFns[key]
    var overrideValues = overrides[key]
    if(typeof(overrideValues)==='string'){
      overrideValues = {
        url:overrideValues
      }
    }
    var fnOpts = Object.assign({}, opts, overrideValues)
    ret[key] = function(passedOpts){
      var passOpts = Object.assign({}, fnOpts, passedOpts)
      fn(passOpts)
    }
  })

  /*
  
    a fixed sequence we can use to verify the mockauthserver
    
  */
  ret.fullSuite = function(opts){
    ret.checkNoLogin(opts)

    ret.checkSignup(opts)

    ret.checkNoLogin(opts)

    ret.doLogin(opts)

    ret.checkHasLogin(opts)

    ret.checkDetails(opts)

    ret.doLogout(opts)

    ret.checkNoLogin(opts)
  }

  return ret
}

module.exports = {
  checkSignup:checkSignup,
  checkDetails:checkDetails,
  checkNoLogin:checkNoLogin,
  checkHasLogin:checkHasLogin,
  doLogin:doLogin,
  doLogout:doLogout,
  factory:factory
}