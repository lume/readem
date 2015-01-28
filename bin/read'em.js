#!/usr/bin/env node

var app        = require('commander')
var dox        = require('dox')
var spawn      = require('child_process').spawn
var path       = require('path')
var atat       = require('at-at')
var fs         = require('fs')
var callAfter  = require('army-knife/callAfter').default
var browserify = require('browserify')()

app.version('0.0.1')
    .option('-s, --source <source>', 'The source file or directory.')
    .option('-o, --output <destination>', 'The output directory.')
    .option('-p, --port <port>', 'The port to serve the docs on.')
    .parse(process.argv)

if (app.source) {
    app.source = path.resolve(app.source)
}
else {
    app.source = process.env.PWD
}

/**
 * Generates dox JSON at the given directory, then fires the callback.
 *
 * @param {string} dir A directory containing source files that we wish to
 * generate dox JSON for.
 * @param {Function} callback The callback function to call after docs are
 * parsed into JSON format.
 */
function genDocs(dir, callback) {
    var docs = [] // contains the dox results for each file.

    // TODO: upgrade at-at so that it takes a filter, and read docs for all
    // files that match the filter, not just .js files.
    atat.walk(dir, function(files) {
        files = files.filter(function(file) {
            var extension = 'js'
            return !!file.match(new RegExp('^.*\.'+extension+'$'))
        })

        callback = callAfter(files.length, callback).bind(this)

        files.forEach(function(file) {
            fs.readFile(file, function(err, data) {
                docs.push({
                    file: file,
                    comments: dox.parseComments(data.toString())
                })
                callback(docs)
            })
        })
    })
}

/**
 * Serves the current directory on the given port.
 *
 * @param {number} port The integer port to serve.
 */
function serve(port) {

    var server = spawn(path.resolve(__dirname, '../node_modules/.bin/serve'),
                       ['-p', (port ? port : '')])

    server.stdout.on('data', function(data) {
        console.log('server stdout:', data.toString())
    })

    server.stderr.on('data', function(data) {
        console.log('server sterr:', data.toString())
    })

    server.on('close', function(code) {
        console.log('server exited!')
    })
}

genDocs(app.source, function(docs) {
    serve(app.port)
})
