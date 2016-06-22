var authTools = require('./tools')

/*

  get an environment variable with a default

  if the env variable has a 'prefix' it means
  'the value of this other env variable'

  for example - if the prefix is 'env:' and the
  variable 'MONGO_HOST' had the value:

  env:MONGODB_SERVER_HOST

  it means:

  make the value of 'MONGO_HOST' the same as 'MONGODB_SERVER_HOST'

  this is useful when running in k8s or something else that will
  populate a certain variable with service connection variables

   * name - the name of the variable
   * def - the default value
   * opts
       - prefix - control the prefix for variable pointers (default to 'env')
       - required - if true and variable is blank then print error message and exit(1)
  
*/

// turn a string with 'env:<varname>' into the value of varname
function processValue(value, prefix){
  value = value || ''
  prefix = prefix || 'env'
  value = value.toString()
  if(value.indexOf(prefix + ':')==0){
    var varname = value.split(prefix + ':')[1]
    return process.env[varname]
  }
  else{
    return value
  }
}

function getenv(name, def, opts){
  opts = opts || {}
  var value = process.env[name]
  if(!value){
    if(def){
      value = def
    }
    else if(opts.required){
      console.error(name + ' env var required')
      process.exit(1)
    }
  }
  return processValue(value, opts.prefix)
}

function mongoConnectionString(host, port, db){
  if(!host || !port || !db){
    throw new Error("host, port and db needed for mongo connection string")
  }
  return 'mongodb://' + host + ':' + port + '/' + db
}

/*

  get a collection of options for one service based on the env 
  
*/
function getServiceOptions(name, opts, useName){
  opts = opts || {}

  useName = useName || name
  var ret = {}

  ret[name + '_host'] = getenv(useName.toUpperCase() + '_SERVICE_HOST', opts.host)
  ret[name + '_port'] = getenv(useName.toUpperCase() + '_SERVICE_PORT', opts.port)
  ret[name + '_path'] = getenv(useName.toUpperCase() + '_SERVICE_PATH', opts.path)
  ret[name + '_secret'] = getenv(useName.toUpperCase() + '_SERVICE_SECRET', opts.secret)

  return ret
}

function getServiceUrl(opts, name){
  return 'http://' + opts[name + '_host'] + ':' + opts[name + '_port']
}

function injectServiceOptions(name, opts, defs, useName){
  opts = opts || {}
  useName = useName || name
  var useDefs = getServiceOptions(name, defs, useName)
  Object.keys(useDefs || {}).forEach(function(key){
    opts[key] = opts[key] || useDefs[key]
  })
  opts[name + '_url'] = 'http://' + opts[name + '_host'] + ':' + opts[name + '_port']
  return opts
}

function getHeaderInjector(servicename, opts){
  var secret = opts[servicename + '_secret']
  return function(headers, data){
    return authTools.injectToken(secret, data, headers)
  }
}

function getPath(path){
  path = path || ''
  if(path) path = (path.indexOf('/')==0 ? '' : '/') + path
  return path
}

function getUrlWrapper(servicename, opts){
  var url = getServiceUrl(opts, servicename) + (opts[servicename + '_path'] || '')
  return function(path){
    return url + (path || '')
  }
}

module.exports = {
  getenv,
  mongoConnectionString,
  getServiceOptions,
  injectServiceOptions,
  getServiceUrl,
  getHeaderInjector,
  getPath,
  getUrlWrapper
}