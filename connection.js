module.exports = function(mongoose, opts, done){

  opts = opts || {}

  function connect () {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    console.log('connecting to mongo: ' + opts.mongo)
    return mongoose.connect(opts.mongo, options).connection;
  }

  connect()
    .on('error', console.log)
    .on('disconnected', connect)
    .once('open', done)

}