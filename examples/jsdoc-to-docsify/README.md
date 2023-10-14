How to run the example:

- while in this directory, run `npm install`
- then run `node ./build-docs.js`

Try:

- Open src/Bar.ts
- Modify a JSDoc comment
- add or remove a class property or method
- re-run `node ./build-docs.js`

Any time you run the `./build-docs.js` script, it will overwrite the
`./docs/api/` folder with new content. In that file, we define what markdown
we want to output. See comments in `./build-docs.js`.
