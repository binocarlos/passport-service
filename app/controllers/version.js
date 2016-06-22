var pkg = require('../../package.json')
exports.version = function(req, res) {
  res.end(pkg.version)
}