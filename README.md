read'em
=======

Read the !@#$%^& docs!


Usage
-----

Use readem to generate and serve docs for source files that uses jsdoc-style
doc comments. Readem uses [dox](https://github.com/tj/dox) for parsing
comments, so take a look at that project to get an idea of what types of
comment features are supported. Also see [usejsdoc.org](http://usejsdoc.org/)
for basic jsdoc syntax and tags.

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
