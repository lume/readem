// TODO: These tests need to run in Node.js (or Electron with Node APIs,
// https://github.com/modernweb-dev/web/issues/2136) because readem uses Node.js
// APIs.

import {FileScanner, FolderScanner, CommentAnalyzer, MarkdownRenderer} from './index.js'

// TODO move type def to @lume/cli, map @types/jest's `expect` type into the
// global env.
declare global {
	function expect(...args: any[]): any
}

describe('readem', () => {
	it('has classes', () => {
		expect(FileScanner).toBeInstanceOf(Function)
		expect(FolderScanner).toBeInstanceOf(Function)
		expect(CommentAnalyzer).toBeInstanceOf(Function)
		expect(MarkdownRenderer).toBeInstanceOf(Function)
	})

	// TODO ... more tests ...
})
