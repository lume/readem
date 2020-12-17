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

	console.log(docsMeta.classes.get('Bar'))

	const writePromises = []

	// For each class, we write a markdown file in whatever format we want.
	for (const [, classInfo] of docsMeta.classes) {
		// f.e. ./src/Bar.js
		const sourceFile = classInfo.file

		// f.e. ./docs/api/Bar.md
		const outputFile = sourceFile.replace('src/', 'docs/api/').replace('.js', '.md')

		const promise = fs.promises.writeFile(path.resolve(outputFile), classMarkdownTemplate(classInfo))

		writePromises.push(promise)
	}

	await Promise.all(writePromises)
}

// Using the information regarding the detected classes, we can generate
// whatever markdown format we want. Question is, what markdown do we want. A
// good place to experiment with GitHub markdown is at http://gist.github.com.
// We can write some markdown there to decide how we want the docs to look, then
// generate that same format here.
function classMarkdownTemplate(classInfo) {
	return `
# \`${classInfo.abstract ? 'abstract ' : ''}class ${classInfo.name}\`

## \`extends ${classInfo.extends.join(', ')}\`

## properties

${Object.entries(classInfo.properties).map(
	([name, {type, description, access}]) => ` - _${access}_ **${name}**: ${type} - ${description}`,
)}
`
}
