var path    = require('path')
var fs      = require('fs')
var rimraf  = require('rimraf')
var osenv   = require('osenv')
var pwt     = require('../')

var n = 0
exports.setupdir = function (tree) {
  var dir = path.join(osenv.tmpdir(), 'pwt-test-'+(++n))
  rimraf.sync(dir)
  setup(dir, tree)

  function setup (filepath, node) {
    if (node.link) {
      // a file
      fs.writeFileSync(filepath, ''+new Date())
    } else {
      // a directory
      fs.mkdirSync(filepath)
      for (var k in node)
        setup(path.join(filepath, k), node[k])
    }
  }

  return dir
}

exports.recurse = function (published, working, fn) {
  var handledKs = {}

  // run through published
  if (published) {
    for (var k in published) {
      if (!published[k].link)
        exports.recurse(published[k], (working?working[k]:null), fn)
      else
        fn(published[k], (working?working[k]:null))
      handledKs[k] = 1
    }
  }

  // run through working
  if (working) {
    for (var k in working) {
      if (handledKs[k])
        continue

      if (working[pwt.STAT].isDirectory())
        exports.recurse((published?published[k]:null), working[k], fn)
      else
        fn((published?published[k]:null), working[k])
    }
  }
}

exports.tostr = function (tree, spaces) {
  spaces = spaces||'  '
  var str = ''
  str += spaces + tree[pwt.PATH] + '\n'
  str += spaces + (tree[pwt.MODIFIED]?'':'not ') + 'modified' + '\n'
  str += spaces + (tree[pwt.DELETED]?'':'not ') + 'deleted' + '\n'
  str += spaces + (tree[pwt.ACTIVE]?'':'not ') + 'active' + '\n'
  if (tree[pwt.TYPE] == 'directory') {
    for (var k in tree)
      str += spaces + k + ': ' + exports.tostr(tree[k], spaces + '  ')
  }
  return '\n'+str
}