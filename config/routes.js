const users = require('../app/controllers/users')
const version = require('../app/controllers/version')
const config = require('./config')

module.exports = function (app, passport) {

  app.get(config.bind_path_v1 + '/version', version.version)
  app.get(config.bind_path_v1 + '/status', users.status)
  app.get(config.bind_path_v1 + '/logout', users.logout)
  app.post(config.bind_path_v1 + '/register', users.register)
  app.post(config.bind_path_v1 + '/login', users.login)
  app.post(config.bind_path_v1 + '/details', users.details)

  /*
  
    loop each oauth provider and setup routes
    (e.g. /auth/github/login)
    
  */
  Object.keys(config.auth || {}).forEach(function(key){

    var authConfig = config.auth[key]

    app.get(config.bind_path_v1 + '/' + key,
      passport.authenticate(key, {
        failureRedirect: config.failure_redirect,
        scope: authConfig.scope
    }), users.noop)

    app.get(config.bind_path_v1 + '/' + key + '/callback',
      passport.authenticate(key, {
        failureRedirect: config.failure_redirect
      }), users.redirect);

  })

  app.use(function (req, res) {
    res.status(404).json({
      url: req.originalUrl,
      error: 'Not found'
    })
  });
};
