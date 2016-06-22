const App = require('./app')
const config = require('./config/config')
const app = App()

app.connect(config.mongo, function(){
  console.log('mongo connected to: ' + config.mongo)
  app.express.listen(config.port, function(){
    console.log('server listening on port: ' + config.port)
  })
})