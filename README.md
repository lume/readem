# read'em

Read the !@#\$%^& docs!

Use readem to generate and serve documentation for source files that use
JSDoc-style comments.

This is a WIP. For now, see the jsdoc-to-docsify example's
[README](./examples/jsdoc-to-docsify/README.md). Docsify rendering is coming
next, along with support for more tags.

Features:

-   Scan for and retrieve data from all JSDoc comments of all files in a given
    folder (and subfolders) using the `FolderScanner` class. This gives you a JS
    object with all the information from every tag. This does not do anything
    more than that.
    -   The JSDoc syntax is loose. _All_ JSDoc tags follow the format `@thetag {type} name - and a description` where all fields are optional. The object literal returned for each tag is simple, something like the following (TODO expand once we use readem to generate readem's docs):
    ```js
    // Map of file to array of comments (in order they are found in their file)
    return {
    	// A file mapped to its comments.
    	'./path/to/source/file.js': [
    		// Each comment is a map of tag names to tag content
    		{
    			thetag: {type: 'type', name: 'name', description: 'and a description'},
    			othertag: {type: 'SomeType', name: 'something', description: 'and a another description'},
    		},
    		// And here's the tag content of another comment in the same file.
    		{
    			anothertag: {type: 'SomeType', name: 'another', description: 'and a another description'},
    		},
    	],
    	// Another file and its comments' tag data. Note the .cpp extension. FolderScanner looks for comments (/** */), regardless of source format.
    	'./path/to/another/file.cpp': [
    		{
    			onemoretag: {type: 'SomeType', name: 'onemore', description: 'and yet another description'},
    		},
    	],
    }
    ```
-   The `CommentAnalyzer` class takes things one step further: it builds on top of
    `FolderScanner` to analyze all the extracted JSDoc tags and does things like create JS
    objects representing information for classes (including their properties and
    methods) and functions (including their parameters and return types). TODO: This should probably be renamed to `ProgrammingCommentAnalyzer` (because we could, for example, make an analyzer that analyzes JSDoc comments from CSS files). It returns an object similar to the following (TODO make docs and ensure this is accurate):

    ```js
    return {
    	// The path of the folder that CommentAnalyzer was told to scan.
    	sourceFolder: './path/to/folder/',

    	// Class info is gathered from JSDoc comments with the `@class` tag, and
    	// all the comments with `@property` or `@method` tags found between a
    	// respective `@class` comment and the next `@class` comment or file
    	// ending.
    	classes: {
    		// `@class` comments and supporting comments.
    		SomeClass: {
    			name: 'SomeClass',
    			file: './path/to/SomeClass.php',
    			description: 'The description of the class',
    			abstract: boolean, // With the `@abstract` tag.
    			extends: [
    				// This is an array of the class names that the given class extends
    				// (from multiple `@extends` tags naming the classes that are
    				// extended). This is useful for documenting not just single
    				// inheritance, but also multiple inheritance (f.e. this could be
    				// done with "class-factory mixins" in JavaScript/TypeScript, but
    				// instead of describing the mixin functions). By knowing the name,
    				// information for the base class can be grabbed from the root
    				// `classes` map.
    				'OneClass',
    				'AnotherClass',
    				// ...
    			],
    			properties: {
    				// `@property` comments
    				someProp: {
    					name: 'someProp',
    					description: 'The description of the property',
    					access: 'protected', // `@public` (default), `@protected`, or `@private` tags
    					type: 'SomeType',
    				},
    				// more properties...
    			},
    			methods: {
    				// `@method` comments
    				someMethod: {
    					name: 'someMethod',
    					description: 'The description of the method',
    					access: 'public',
    					params: {
    						// `@param` tags
    						parameterName: {
    							name: 'parameterName',
    							type: 'SomeType',
    							description: "The parameter's description.",
    						},
    						// more parameters...
    					},
    					returns: 'SomeReturnType', // `@return` or `@returns` tag
    				},
    				// more methods...
    			},
    		},
    		// more classes.
    	},
    	// This contains info for any comment with an `@function` tag that also contains @param or @return or @returns JSDoc tags.
    	functions: {
    		// `@function` comments
    		someFunction: {
    			name: 'someFunction',
    			file: './path/to/someFunction.ts',
    			description: 'The description of the method',
    			params: {
    				// `@param` tags
    				parameterName: {
    					name: 'parameterName',
    					type: 'SomeType',
    					description: "The parameter's description.",
    				},
    				// more parameters...
    			},
    			returns: 'SomeReturnType', // `@return` or `@returns` tag
    		},
    		// more functions...
    	},
    }
    ```

    TODO: Allow grouping by type, or grouping by file.

    TODO The analysis is fairly simple for now, and convers the most basic
    features of classes and functions: only classes and functions are
    analyzed, and basically what you see above is all the information that is
    returned. We could add more things like `@

-   The `MarkdownRenderer` class goes even one step further, but this class is
    the most incomplete class at the moment. Given what `CommentAnalyzer` spits
    out, `MarkdownRenderer` will output markdown files (based on data from the
    analyzed classes and functions) to a destination folder, matching the same
    folder structure as with the input source folder, but inside the destination
    folder. If a class extends another class, `MarkdownRenderer` will create a
    link to the other class's file, making it navigable.

    TODO: Also include functions, like with build-docs.js in the
    jsdoc-to-docsify example.

<!--
OLD DOCS:

Readem uses [dox](https://github.com/tj/dox) for parsing comments, so take a
look at that project to get an idea of what types of jsdoc/custom features are
supported. Visit [usejsdoc.org](http://usejsdoc.org/) to learn jsdoc syntax and
tags.

## Usage

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

visit `http://localhost:1134` in your browser to read the !@#\$%^& docs!

To see available options, use the `-h` flag.

```
readem -h
```
-->
