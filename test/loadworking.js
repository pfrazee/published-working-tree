var tape = require('tape')
var pwt  = require('../')
var u    = require('./util')

// mock data
var HASH    = 'this_is_a_link_hash_but_not_rly_tho'
var published = {
  subdir: {
    subdir: {      
      file1: { link: HASH },
      file2: { link: HASH }
    },
    file1: { link: HASH },
    file2: { link: HASH }
  },
  file1: { link: HASH },
  file2: { link: HASH }
}

tape('loadworking: empty directory', function (t) {
  var dir = u.setupdir({})

  pwt.loadworking(dir, published, function (err, working) {
    if (err) throw err
    console.log('working tree:', u.tostr(working))

    u.recurse(published, working, function (p, w) {
      t.ok(p)
      t.ok(w)
      t.equal(w[pwt.DELETED], true)
      t.equal(w[pwt.ACTIVE], true)
    })
    t.end()
  })
})

tape('loadworking: perfect match', function (t) {
  var dir = u.setupdir(published)

  pwt.loadworking(dir, published, function (err, working) {
    if (err) throw err
    console.log('working tree:', u.tostr(working))

    u.recurse(published, working, function (p, w) {
      t.ok(p)
      t.ok(w)
      t.equal(w[pwt.DELETED], false)
      t.equal(w[pwt.ACTIVE], true)
      t.ok(w[pwt.STAT])
    })
    t.end()
  })
})

tape('loadworking: two different trees', function (t) {
  var dir = u.setupdir({
    subfolder: {
      subfolder: {      
        entry1: { link: HASH },
        entry2: { link: HASH }
      },
      entry1: { link: HASH },
      entry2: { link: HASH }
    },
    entry1: { link: HASH },
    entry2: { link: HASH } 
  })

  pwt.loadworking(dir, published, function (err, working) {
    if (err) throw err
    console.log('working tree:', u.tostr(working))

    u.recurse(published, working, function (p, w) {
      if (p && w) {
        t.equal(w[pwt.DELETED], true)
        t.equal(w[pwt.ACTIVE], true)
      }
      else if (w) {
        t.equal(w[pwt.DELETED], false)
        t.equal(w[pwt.ACTIVE], false)
        t.ok(w[pwt.STAT])        
      }
      else
        throw "this shouldnt happen"
    })
    t.end()
  })
})