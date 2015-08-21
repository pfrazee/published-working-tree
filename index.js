var fs = require('fs')
var path = require('path')
var multicb = require('multicb')

// symbols, used in the file-trees to create non-string keys which wont collide with filenames
var TYPE      = exports.TYPE      = Symbol('type')
var STAT      = exports.STAT      = Symbol('stat')
var NAME      = exports.NAME      = Symbol('name')
var PATH      = exports.PATH      = Symbol('path')
var PUBLISHED = exports.PUBLISHED = Symbol('published')
var MODIFIED  = exports.MODIFIED  = Symbol('modified')
var DELETED   = exports.DELETED   = Symbol('deleted')
var ACTIVE    = exports.ACTIVE    = Symbol('active')
var DIRREAD   = exports.DIRREAD   = Symbol('dirread')

// load working tree from published tree
var loadworking =
exports.loadworking = function (rootpath, publishedTree, cb) {
  var workingTree = {}
  read(rootpath, workingTree, publishedTree||true, function () {
    cb(null, workingTree)
  })
}

// reads all of the directory tree
var readall =
exports.readall = function (filepath, working, cb) {
  read(filepath, working, true, function () {
    var done = multicb()
    for (var k in working) {
      if (working[k][TYPE] == 'directory')
        readall(working[k][PATH], working[k], done())
    }
    done(cb)
  })
}

// recursive function to read from disk and merge with the published tree
// - `published` may be `true` to force load of a directory, despite no `publishedTree` entry
var read =
exports.read = function (filepath, working, published, cb) {
  var publishedIsFolder = isobj(published) && !published.link

  // read file info
  fs.stat(filepath, function (err, stat) {
    if (err || !stat) {
      // file not found, copy over info from the published tree, if relevant
      if (isobj(published))
        notfoundCopy(filepath, working, published)
      return
    }

    // copy state
    working[TYPE]      = stat.isDirectory() ? 'directory' : 'file'
    working[NAME]      = path.basename(filepath)
    working[PATH]      = filepath
    working[STAT]      = stat
    working[MODIFIED]  = isobj(published) && (published.mtime != stat.mtime.getTime())
    working[DELETED]   = false
    working[PUBLISHED] = isobj(published)
    working[ACTIVE]    = isobj(published)

    if (stat.isDirectory() && published) {
      working[DIRREAD] = true
      // read contained files
      fs.readdir(filepath, function (err, files) {
        if (err || !files)
          return next()

        // recurse on each
        var done = multicb()
        files.forEach(function (k) {
          working[k] = {}
          read(path.join(filepath, k), working[k], (isobj(published)?published[k]:null), done())
        })
        done(next)
      })
    } else next()

    function next () {
      if (publishedIsFolder) {
        // look through published, mark any missing items as deleted
        for (var k in published) {
          if (!working[k]) {
            working[k] = {}
            notfoundCopy(path.join(filepath, k), working[k], published[k])
          }
        }
      }
      cb()
    }
  })
}

// gets change-state of item
var change =
exports.change = function (item) {
  if (item[TYPE] == 'directory')
    return
  if (item[ACTIVE]) {
    if (item[MODIFIED])
      return 'mod'
    else if (!item[PUBLISHED] && !item[DELETED])
      return 'add'
  } else {
    if (item[DELETED])
      return 'del'
  }
}

// enumerates modifications to be published
var changes =
exports.changes = function (working) {
  var c = { adds: [], dels: [], mods: [] }
  check(working)
  return c

  function check (item) {
    if (!item)
      return

    var k = change(item)
    if (k) c[k+'s'].push(item)

    for (var k in item)
      check(item[k])
  }
}

// for when a node was not found on disk, that is present in the published tree
// this function copies over the attributes and flags `deleted`
function notfoundCopy (filepath, w, p) {
  w[TYPE]      = (!p.link) ? 'directory' : 'file'
  w[NAME]      = path.basename(filepath)
  w[PATH]      = filepath
  w[STAT]      = null
  w[MODIFIED]  = false
  w[DELETED]   = true
  w[PUBLISHED] = true // was published
  w[ACTIVE]    = true // was published, should be active

  // recurse
  for (var k in p) {
    if (isobj(p[k])) {
      w[k] = {}
      notfoundCopy(path.join(filepath, k), w[k], p[k])
    }
  }
}

function isobj (v) {
  return v && typeof v == 'object'
}