#!/usr/bin/env node

var app        = require('commander')
var dox        = require('dox')
var spawn      = require('child_process').spawn
var path       = require('path')
var atat       = require('at-at')
var fs         = require('fs')
var callAfter  = require('army-knife/callAfter').default
var browserify = require('browserify')()
var rndm       = require('rndm')
var mkdirp     = require('mkdirp')
var ejs        = require('ejs')

/**
 * Get's the version of readem
 *
 * @param {Function} callback Gets called after the version is gotten, passed a
 * signle argument: the version as a semver string.
 */
function getVersion(callback) {
    var packageJson = [path.dirname(path.dirname(require.main.filename)),
        'package.json'] .join('/')

    fs.readFile(packageJson, function(err, data) {
        if (err) throw new Error(err)
        callback(JSON.parse(data).version)
    });
}

/**
 * Set's up the CLI, using commander.
 *
 * @param {string} version The version that gets shown at the command line by
 * commander.
 */
function setUpCli(version) {
    app.version(version)
        .option('-s, --source <source>',
                'The source file or directory to generate docs for.',
                'src')
        .option('-o, --output <destination>', 'The output directory.')
        .option('-p, --port <port>', 'The port to serve the docs on.', 1134)
        .parse(process.argv)

    if (app.source) app.source = path.resolve(app.source)
    else app.source = process.env.PWD

    if (!app.output)
        do app.output = ['/tmp/readem', rndm(24)].join('/')
        while (fs.existsSync(path.resolve(app.output)))
}

/**
 * Generates dox JSON at the given directory, then fires the callback.
 *
 * @param {string} dir A directory containing source files that we wish to
 * generate dox JSON for.
 * @param {Function} callback Gets called after dox are ready, receiving a
 * single argument: the JSON dox, or null if no files were available to parse.
 */
function getDox(dir, callback) {
    var docs = [] // contains the dox results of each file.

    // TODO: upgrade at-at so that it takes a filter, and read docs for all
    // files that match the filter, not just .js files.
    atat.walk(dir, function(files) {

        // filter the files in the dir so we have only files ending with .js
        files = files.filter(function(file) {
            var extension = 'js'
            return !!file.match(new RegExp('^.*\\.'+extension+'$'))
        })

        if (files.length)
            callback = callAfter(files.length, callback).bind(this)
        else console.log('No files found!'), callback(null)

        files.forEach(function(file) {
            fs.readFile(file, function(err, data) {
                if (err) throw new Error(err)

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
 * @param {string} dir The directory to serve
 * @param {number} port The integer port to serve.
 */
function serve(dir, port) {
    var server = spawn(path.resolve(__dirname, '../node_modules/.bin/serve'),
                       [dir, '-p', port])

    server.stdout.on('data', function(data) {
        console.log(data.toString())
    })

    server.stderr.on('data', function(data) {
        console.log('server err:', data.toString())
    })

    server.on('close', function(code) {
        console.log('server exited!')
    })
}

/**
 * Generate documentation based on the dox of some source code.
 *
 * @param {Array} dox An array of dox results, each item the dox parsed from a
 * file.
 * @param {Object} options Options for generating the docs.
 * @param {Object} options.dox An array of dox to generate dox from.
 * @param {Object} options.template The name of a file that is an EJS template,
 * used for the generated page of each source file.
 * @param {string} dest The destination folder to place the generated docs
 * files in.
 * @param {Function} callback Called when docs are done being made.
 */
function genDocs(dox, options, callback) {
    //mkdirp.sync(dest)
    console.log(path.resolve(templateFile))

    dox.forEach(function(dox) {
        console.log('got a dox!')
    })

    callback()
}

getVersion(function(version) {
    setUpCli(version)

    getDox(app.source, function(dox) {
        if (dox) genDocs(dox, '../src/js', app.output, function() {
            serve(app.output, app.port)
        })
    })
})
