#!/usr/bin/env node

var cli = require('commander')
var dox = require('dox')
var spawn = require('child_process').spawn
var path = require('path')
var atat = require('at-at')
var fs = require('fs')
var callAfter = require('army-knife/callAfter').default
var rndm = require('rndm')
var mkdirp = require('mkdirp')
var ejs = require('ejs')
var async = require('async')
var webpack = require('webpack')

/**
 * Gets the version of readem
 *
 * @param {Function} callback Gets called after the version is gotten, passed a signle argument: the version as a semver string.
 */
function getVersion(callback) {
    var packageJson = [path.dirname(path.dirname(require.main.filename)), 'package.json'].join('/')

    fs.readFile(packageJson, function(err, data) {
        if (err) throw new Error(err)
        callback(JSON.parse(data).version)
    })
}

/**
 * Set's up the CLI, using commander to get specified command line arguments,
 * and setting defaults for arguments that aren't supplied.
 *
 * @param {string} version The version that gets shown at the command line by commander.
 */
function setUpCli(version) {
    cli.version(version)
        .option(
            '-s, --source <source>',
            'The directory containing source files to generate docs for. Defaults to ./src.'
        )
        .option(
            '-o, --output <destination>',
            'The output directory for the docs. Defaults to a random folder in /tmp/readem.'
        )
        .option('-t, --template <destination>', 'The template to use. Defaults to the template shipped with readem.')
        .option('-p, --port <port>', 'The port on which the output folder will be served. Defaults to 1134.', 1134)
        .option('-S, --singleStar', 'Read single star comments too, not just double star comment.')
        .parse(process.argv)

    // If source isn't specified, use the current working directory.
    if (cli.source) cli.source = path.resolve(cli.source)
    else cli.source = process.env.PWD

    // If the output dir isn't specified, choose a random one that doesn't
    // already exist in /tmp/readem.
    if (cli.output) cli.output = path.resolve(cli.output)
    else
        do cli.output = ['/tmp/readem', rndm(24)].join('/')
        while (fs.existsSync(path.resolve(cli.output)))

    if (!cli.template) cli.template = path.resolve(__dirname, '../src/ejs/html/app.ejs')
}

/**
 * Generates dox JSON at the given directory, then fires the callback.
 *
 * @param {string} dir A directory containing source files that we wish to generate dox JSON for.
 * @param {Object} options Object literal of options to be passed to dox. Applies to all files. See github.com/tj/dox for more info.
 * @param {Function} callback Gets called after dox are ready, receiving a single argument: the JSON dox, or null if no files were available to parse.
 */
function getDox(dir, options, callback) {
    var docs = [] // contains the dox results of each file.

    // TODO: upgrade at-at so that it takes a filter, and read docs for all
    // files that match the filter, not just .js files.
    atat.walk(dir, function(files) {
        // filter the files in the dir so we have only files ending with .js
        files = files.filter(function(file) {
            var extension = 'js'
            return !!file.match(new RegExp('^.*\\.' + extension + '$')) && !fs.lstatSync(file).isDirectory()
        })

        if (files.length) callback = callAfter(files.length, callback).bind(this)
        else callback(null, new Error(' --- No files found!'))

        files.forEach(function(file) {
            fs.readFile(file, function(err, data) {
                if (err) {
                    console.log('error on file', file)
                    throw new Error(err)
                }

                docs.push({
                    file: file,
                    comments: dox.parseComments(data.toString(), options),
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
    var server = spawn(path.resolve(__dirname, '../node_modules/.bin/serve'), [dir, '-p', port])

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
 * Generate documentation based on an array of dox.
 *
 * @param {Array} dox An array of dox results, each item the dox parsed from a file.
 * @param {Object} options Options for generating the docs.
 * @param {Object} options.dox An array of dox to generate dox from.
 * @param {Object} options.template The name of a file that is an EJS template, used for the generated page of each source file.
 * @param {Object} options.dest The directory where the docs are outputted to.
 * @param {Object} options.source The source dir of the documented files.
 * @param {Function} callback Called when docs are done being made.
 */
function genDocs(dox, options, callback) {
    async.waterfall(
        [
            function(done) {
                async.parallel(
                    {
                        mkdir: function(done) {
                            // make the output directory.
                            mkdirp(options.dest, done)
                        },
                        template: function(done) {
                            // get the template, bundle the app file, then render the template.
                            fs.readFile(options.template, done)
                        },
                    },
                    function(err, results) {
                        done(err, results.template)
                    }
                )
            },
            function(template, done) {
                async.parallel(
                    {
                        bundle: function(done) {
                            var entry = path.resolve(__dirname, '../src/ejs/js/app.js')

                            // TODO: accept an app file via the command line?
                            // TODO extnsible webpack config

                            webpack(
                                {
                                    entry,
                                    devtool: 'source-map',
                                    mode: 'development',
                                    output: {
                                        path: options.dest,
                                        filename: 'app.js',
                                    },
                                    resolve: {
                                        extensions: ['.js', '.jsx', '.ts', '.tsx'],
                                        alias: {
                                            infamous: 'infamous/src',
                                        },
                                    },
                                    module: {
                                        rules: [
                                            {
                                                test: /\.js$/,
                                                use: ['source-map-loader'],
                                                enforce: 'pre',
                                            },
                                            {
                                                test: /\.css$/,
                                                use: ['style-loader', 'css-loader'],
                                            },
                                            {
                                                test: /\.tsx?$/,
                                                exclude: [/node_modules(?!\/(infamous))/],
                                                loader: 'ts-loader',
                                                options: {
                                                    transpileOnly: true,
                                                    //experimentalWatchApi: true,
                                                },
                                            },
                                        ],
                                    },
                                },
                                (err, stats) => {
                                    if (err) throw err
                                    if (stats.hasErrors()) {
                                        console.log(stats.toString())
                                        throw new Error('^ compilation has errors.')
                                    }

                                    done()
                                }
                            )
                        },
                        dox: function(done) {
                            var whenFinished = callAfter(dox.length, done)

                            dox.forEach(function(dox) {
                                var rendered = ejs.render(template.toString(), {
                                    dox: dox,
                                })

                                // Mirror the structure of the source directory in the output directory.
                                var relativeFile = dox.file.replace(options.source + '/', '')
                                relativeFile = [relativeFile, 'html'].join('.')
                                mkdirp.sync(path.join(options.dest, path.dirname(relativeFile)))

                                fs.writeFile(path.join(options.dest, relativeFile), rendered, function(err) {
                                    if (err) throw new Error('Error writing doc file for ' + dox.file + '.')
                                    whenFinished()
                                })
                            })
                        },
                    },
                    done
                )
            },
        ],
        callback
    )
}

/*!
 * ignore
 */
console.log(' --- Generating docs...')
getVersion(function(version) {
    setUpCli(version)

    getDox(
        cli.source,
        {
            skipSingleStar: !cli.singleStar,
        },
        function(dox) {
            if (dox)
                genDocs(
                    dox,
                    {
                        dox: dox,
                        template: cli.template,
                        dest: cli.output,
                        source: cli.source,
                    },
                    function() {
                        console.log(' --- Done.')
                        serve(cli.output, cli.port)
                    }
                )
        }
    )
})
