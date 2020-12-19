// @ts-check
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import {CommentAnalyzer} from 'readem'
import mkdirp from 'mkdirp'

main().catch(e => {
	// Make sure the process exits with a non-zero exit code on unhandle promise
	// rejections. This won't be necessary in an upcoming release of Node.js, in
	// which case it'll exit non-zero automatically. Time of writing this comment:
	// Node 13.8.
	console.error(e)
	process.exit(1)
})

async function main() {
	// At the moment, CommentAnalyzer only return detected classes and their members.
	const docsMeta = await new CommentAnalyzer().analyze('./src')

	// We need to do some work to have it provide info for some other things,
	// based on needs of a project.

	// In another example, we can use the `FileScanner` class instead of the WIP
	// `CommentAnalyzer` class, and receive just the plain object mapping files
	// to comments, and do whatever we want that way.

	// First clear the folder that we will output markdown files to.
	await new Promise((done, error) =>
		rimraf(path.resolve('./docs/api/'), {disableGlob: true}, err => (err ? error(err) : done())),
	)

	await new Promise((resolve, reject) => {
		mkdirp(path.resolve('./docs/api/'), err => {
			if (err) return reject(err)
			resolve()
		})
	})

	const writePromises = []

	/** @typedef {string} Filename */

	/**
	 * A map of file names to the content we will write to those files.
	 * @type {Record<Filename, string>}
	 */
	const fileContents = {}

	// For each class, we write a markdown file in whatever format we want.
	for (const [, classInfo] of docsMeta.classes) {
		// f.e. ./src/Bar.js
		const sourceFile = classInfo.file

		// f.e. ./docs/api/Bar.md
		const outputFile = sourceFile.replace('src/', 'docs/api/').replace('.js', '.md')

		let markdown = fileContents[outputFile] || ''
		markdown += '\n\n' + classMarkdownTemplate(classInfo)
		fileContents[outputFile] = markdown
	}

	for (const [, functionInfo] of docsMeta.functions) {
		// f.e. ./src/Bar.js
		const sourceFile = functionInfo.file

		// f.e. ./docs/api/Bar.md
		const outputFile = sourceFile.replace('src/', 'docs/api/').replace('.js', '.md')

		let markdown = fileContents[outputFile] || ''
		markdown += '\n\n' + functionMarkdownTemplate(functionInfo)
		fileContents[outputFile] = markdown
	}

	for (const [outputFile, markdown] of Object.entries(fileContents)) {
		const promise = fs.promises.writeFile(path.resolve(outputFile), markdown)
		writePromises.push(promise)
	}

	// Wait for all the files to be written
	await Promise.all(writePromises)
}

// Using the information regarding the detected things, we can generate
// whatever markdown format we want. Question is, what markdown do we want. This
// is where we can define that! (We can experiment on GitHub to see what markdown
// output we like.)

/**
 * Generate desired markdown for a class definition.
 * @param {import('readem').ClassMeta} info
 */
function classMarkdownTemplate(info) {
	return `
# \`${info.abstract ? 'abstract ' : ''}class ${info.name}\`

## \`extends ${info.extends.join(', ')}\`

${Object.keys(info.properties).length ? '## properties' : ''}

${Object.values(info.properties)
	.map(({name, type, description, access}) => ` - _${access}_ **${name}**: ${type} - ${description}`)
	.join('\n')}

${Object.keys(info.methods).length ? '## methods' : ''}

${Object.values(info.methods)
	.map(m => methodMarkdownTemplate(m))
	.join('\n\n')}
`
}

/**
 * Generate desired markdown for a function definition.
 * @param {import('readem').FunctionMeta} info
 */
function functionMarkdownTemplate(info) {
	return `
# \`function ${info.name}\`

${info.description || ''}

${Object.keys(info.params).length ? '## params' : ''}

${Object.values(info.params)
	.map(({name, type, description}) => ` - **${name}**: ${type} - ${description}`)
	.join('\n')}

## returns ${info.returns || 'void'}
`
}

/**
 * @param {import('readem').MethodMeta} info
 */
function methodMarkdownTemplate(info) {
	return `
### \`${info.access} method ${info.name}\`

${Object.keys(info.params).length ? '#### params' : ''}

${Object.values(info.params)
	.map(({name, type, description}) => ` - **${name}**: ${type} - ${description}`)
	.join('\n')}

#### returns ${info.returns || 'void'}
`
}
