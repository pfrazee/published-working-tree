# Published Working Tree

Read file-trees from disk and compare against a published tree.
Used in [Patchwork](https://github.com/ssbc/patchwork) to drive publishing interfaces.

## Usage

```js
var pwt = require('published-working-tree')

// symbols used in tree to refer to non-file attributes
pwt.TYPE // 'directory' or 'file'
pwt.STAT // fs.Stat
pwt.NAME // String
pwt.PATH // Path
pwt.PUBLISHED // Boolean
pwt.MODIFIED // Boolean
pwt.DELETED // Boolean
pwt.ACTIVE // Boolean
pwt.DIRREAD // Boolean

// load working tree from disk, compared against a published tree
pwt.loadworking(rootpath, publishedTree, function (err, workingTree) {
  // ...
})

// read all of the directory tree, without a published tree to compare against
var working = {}
pwt.readall (filepath, working, function () {
  // ...
})

// read just one directory
var working = {}
pwt.read (filepath, working, true, function () {
  // ...
})

// enumerate modifications to be published
pwt.changes (working)
// => { adds: [..], dels: [..], mods: [..] }

// get change-state of item
pwt.change (item)
// => 'mod', 'add', or 'del'
```