function checkOpts(opts, names){
  names.forEach(function(name){
    if(!opts[name]){
      throw new Error(name + ' option needed')
    }
  })
}

function getTestTitle(title, opts){
  opts = opts || {}
  return (opts.title ? opts.title + ': ' + title : title)
}

module.exports = {
  checkOpts:checkOpts,
  getTestTitle:getTestTitle
}