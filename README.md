read'em
=======

Read the !@#$%^& docs!

Use readem to generate and serve documentation for source files that use
jsdoc-style comments.

Readem uses [dox](https://github.com/tj/dox) for parsing comments, so take a
look at that project to get an idea of what types of jsdoc/custom features are
supported. Visit [usejsdoc.org](http://usejsdoc.org/) to learn jsdoc syntax and
tags.

Usage
-----

install readem globally.

```
npm install readem -g
```

Go into any directory that contains source files (JavaScript files only, but
possibly more types in the future), then simply run readem without arguments to
generate docs in the current working directory and have them served locally.

```
readem
```

visit `http://localhost:1134` in your browser to read the !@#$%^& docs!

To see available options, use the `-h` flag.

```
readem -h
```
