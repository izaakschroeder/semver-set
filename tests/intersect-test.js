var o = require("ospec")
var intersect = require('../lib/intersect')

o("basic usage", function() {
  o( intersect('^1.1 || ^2.2 || >=5', '^2.2.0-alpha1') ).equals('^2.2.0')
  o( intersect('~2.2.4', '~2.3.0') ).equals(null)
})

o.run()
