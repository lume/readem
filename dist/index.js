import * as fs from 'fs';
import * as path from 'path';
import walker from 'at-at';
import mkdirp from 'mkdirp';
import jsdocTypeParse from 'jsdoctypeparser';
// TODO, import Observable from a separate package linked by Rush.js
import { Observable } from './Observable.js';
/**
 * @class FileScanner - Scans files for JSDoc-style comments, outputting usable
 * objects representing the found tags.
 * @extends Observable
 */
export class FileScanner extends Observable {
    /**
     * @method scanFile - Scans a file and triggers the 'comment' for each comment
     * that the scanner parsers while scanning the file.
     * @param {string} file - The file to scan. If not absolute, will be
     * relative to the current working directory.
     * @param {string} [charset] - The character set of the file. Defaults to "utf8"
     * @returns {Promise<Array<Comment>>} - A promise for when done scanning the file.
     */
    async scanFile(file, charset = 'utf8') {
        // TODO upgrade to using a lexer to scan a stream while reading the file
        let content = await fs.promises.readFile(path.resolve(file), { encoding: charset });
        if (typeof content !== 'string')
            content = content.toString();
        const comments = [];
        const re = doubleStarCommentBlockRegex;
        let commentMatch;
        // extract double-star comments
        while ((commentMatch = re.exec(content))) {
            const originalComment = commentMatch[0];
            const comment = {
                source: originalComment,
                content: [],
            };
            // strip the leading stars, if any
            const commentContent = commentMatch[1].replace(leadingStarsRegex, '');
            const re = jsDocTagRegex;
            let tagMatch;
            // get each part of each JSDoc tag
            while ((tagMatch = re.exec(commentContent))) {
                let type;
                try {
                    type = tagMatch[2] && jsdocTypeParse(tagMatch[2]);
                    type.source = tagMatch[2];
                }
                catch (e) {
                    type = tagMatch[2];
                }
                comment.content.push({
                    source: tagMatch[0],
                    tag: tagMatch[1],
                    type: type || undefined,
                    name: tagMatch[3],
                    description: (tagMatch[4] && tagMatch[4].trim()) || undefined,
                });
            }
            comments.push(comment);
            this.emit('comment', comment);
        }
        return comments;
    }
}
/*
 * - best man
 * - ring bearer
 * - officiator
 * - grooms men
 * - flower boy
 */
/**
 * @class FolderScanner - Scans specified folders for JSDoc-style comments within files.
 * @extends FileScanner
 */
export class FolderScanner extends FileScanner {
    /**
     * @method scanFolder - Scans a folder and all sub-folders any level deep
     * for all JSDoc-like comments in files.
     * @param {string} folder - The folder to scan.
     * @returns {Promise<FileComments[]>} - A promise that resolves to an array
     * of objects, each one containing the normalized comments found in a file
     * of the given folder.
     */
    async scanFolder(folder) {
        const files = await new Promise(resolve => {
            walker.walk(folder, async (files) => {
                const nonDirectories = [];
                const promises = [];
                for (const file of files) {
                    promises.push(fs.promises.stat(path.resolve(file)).then(stats => {
                        if (!stats.isDirectory())
                            nonDirectories.push(file);
                    }));
                }
                await Promise.all(promises);
                resolve(nonDirectories.sort());
            });
        });
        const promises = [];
        for (const file of files) {
            promises.push(this.scanFile(file).then((comments) => {
                const fileResult = {
                    file,
                    comments,
                };
                this.emit('fileScanned', fileResult);
                return fileResult;
            }));
        }
        return Promise.all(promises);
    }
}
// A regex for detecting double-star /** */ comments. See https://regexr.com/4k6je
const doubleStarCommentBlockRegex = /\/\*\*((?:\s|\S)*?)\*\//g;
// A regex to detect the leading asterisks of multiline JSDoc comments. See
// https://regexr.com/4k6k3
const leadingStarsRegex = /^[^\S\r\n]*\*[^\S\r\n]?/gm;
// A regex to detect JSDoc tags in the content of /** */ comment. This is used
// after the content has been extracted using the doubleStarCommentBlockRegex.
// See https://regexr.com/4k6l7
const jsDocTagRegex = /(?<=^[^\S\r\n]*)(?:(?:@([a-zA-Z]+))(?:[^\S\r\n]*(?:{(.*)}))?(?:[^\S\r\n]*((?:[^@\s-]|@@)+))?(?:[^\S\r\n]*(?:-[^\S\r\n]*)?((?:[^@]|@@)*))?)/gm;
///////////////////////////////////////////////////////////////////////////////////
// const scanner = new FileScanner()
// scanner.on('comment', (comment: Comment) => {
//     console.log(comment)
// })
// scanner.scanFile('./src/core/TreeNode.ts')
/**
 * @class Docs - scans a directory for comments, analyzes them to create
 * hierarchy of classes, etc, and finally outputs them using a template.
 */
export class CommentAnalyzer {
    /**
     * @property {FolderScanner} scanner - The scanner used to scan the
     * filesystem for comments in source files.
     */
    scanner = new FolderScanner();
    /**
     * @property {Map<string, ClassMeta>} classes - contains information for
     * classes that are documented in the scanned comments. This is empty at
     * first, and will have been populated after a call to the `.analyze()`
     * method on a directory containing documented source has completed.
     * `classes` is a map of class name to `ClassMeta` object containing
     * information about the class. See the `ClassMeta` type for details.
     */
    classes = new Map();
    functions = new Map();
    /**
     * @method analyze
     * @param {string} folder - The directory that contains whose source files
     * will be scanned for JSDoc-like comments and then analyzed for
     * documentation.
     * @param {(path: string) => boolean} filter - A function that returns `true`
     * if a file should be included, or false otherwise.
     * @returns {Promise<undefined>}
     */
    async analyze(folder, filter) {
        folder = folder.endsWith('/') ? folder : folder + '/';
        const result = await this.scanner.scanFolder(folder);
        for (const file of result) {
            // TODO pass along to at-at/Walker
            if (filter && !filter(file.file))
                continue;
            let currentClass = undefined;
            for (const comment of file.comments) {
                // Each comment can have a primary tag, with multiple support
                // tags. For example, a comment may have a single @class primary
                // tag, along with support tags like @extends and @abstract. Or
                // for example a comment may have a primary @function tag and
                // more than one @param support tags to describe a function's
                // parameters.
                let primaryTags = [];
                // vars for tracking an @class comment
                let Class = undefined;
                let description = undefined;
                let parentClasses = [];
                let abstract = false;
                // for methods and properties
                let access = 'public';
                let foundAccess = false;
                // vars for tracking an @method or @function comments
                let method = undefined;
                let funktion = undefined;
                let params = [];
                let returns = undefined;
                // constructor is a special method
                let constructor = false;
                // vars for tracking an @property comment
                let property = undefined;
                let type = undefined;
                for (const part of comment.content) {
                    // If we have part of a comment that isn't a tag (f.e. all
                    // the text before any tags are encountered in a comment)
                    if (typeof part === 'string') {
                        // not implemented yet
                    }
                    // Otherwise we have a JSDoc tag
                    else {
                        switch (part.tag) {
                            // @class comment ////////////////////////////////////////
                            case 'class': {
                                primaryTags.push(part.tag);
                                if (Class) {
                                    duplicateTagWarning(part, comment);
                                    break;
                                }
                                Class = part.name;
                                currentClass = part.name;
                                description = part.description;
                                break;
                            }
                            case 'inherits': // @inherits is alias of @extends
                            case 'extends': {
                                if (part.name && !parentClasses.includes(part.name))
                                    parentClasses.push(part.name);
                                break;
                            }
                            case 'abstract': {
                                abstract = true;
                                break;
                            }
                            // for @property, @method, or @constructor comments /////////////////////
                            case 'public':
                            case 'protected':
                            case 'private': {
                                if (foundAccess) {
                                    duplicateTagWarning(part, comment);
                                    break;
                                }
                                access = part.tag;
                                foundAccess = true;
                                break;
                            }
                            // @method comment ////////////////////////////////////////
                            case 'constructor': {
                                primaryTags.push(part.tag);
                                if (constructor) {
                                    duplicateTagWarning(part, comment);
                                    break;
                                }
                                constructor = true;
                                method = 'constructor';
                                description = part.description;
                                break;
                            }
                            // @method comment ////////////////////////////////////////
                            case 'method': {
                                primaryTags.push(part.tag);
                                if (method) {
                                    duplicateTagWarning(part, comment);
                                    break;
                                }
                                if (part.type) {
                                    warningForComment(comment, `The {type} field of a @method tag is ignored. Use @param and @return to define the method shape.`);
                                }
                                method = part.name;
                                description = part.description;
                                break;
                            }
                            // @function comment ////////////////////////////////////////
                            case 'function': {
                                primaryTags.push(part.tag);
                                if (funktion) {
                                    duplicateTagWarning(part, comment);
                                    break;
                                }
                                if (part.type) {
                                    warningForComment(comment, `The {type} field of a @function tag is ignored. Use @param and @return to define the function shape.`);
                                }
                                funktion = part.name;
                                description = part.description;
                                break;
                            }
                            case 'param': {
                                if (params.some(p => p.name === part.name)) {
                                    warningForComment(comment, `Duplicate parameters found for an @method or @function comment. Only the first will be used.`);
                                    break;
                                }
                                if (!part.name) {
                                    warningForComment(comment, `A @parameter tag in the comment had no name field. Skipping.`);
                                    break;
                                }
                                params.push({
                                    name: part.name,
                                    description: part.description,
                                    type: part.type,
                                });
                                break;
                            }
                            case 'return': // @return is alias of @returns
                            case 'returns': {
                                if (returns) {
                                    duplicateTagWarning(part, comment);
                                    break;
                                }
                                if (part.name) {
                                    warningForComment(comment, `The name field of a @return (or @returns) tag is ignored.`);
                                }
                                if (!part.type) {
                                    warningForComment(comment, `A @return tag did not have a {type} field, skipping. Specify a return type, f.e. @return {number}.`);
                                }
                                returns = part.type;
                                break;
                            }
                            // @property comment ////////////////////////////////////////
                            case 'property': {
                                primaryTags.push(part.tag);
                                if (property) {
                                    duplicateTagWarning(part, comment);
                                    break;
                                }
                                property = part.name;
                                description = part.description;
                                type = part.type;
                                break;
                            }
                            // @method comment ////////////////////////////////////////
                            case 'typedef': {
                                description = part.description;
                                // TODO
                                break;
                            }
                            // TODO, for certain cases, like if we change from a
                            // @class context to an @object context or similar,
                            // we need to reset currentClass
                            // TODO, we may need a way to signal entering a
                            // nested class context (or similar for other types
                            // of documentables).
                        }
                    }
                }
                // We can only have one primary tag per comment. (f.e. @class, @method)
                if (primaryTags.length > 2)
                    multiplePrimaryTagsWarning(comment, primaryTags);
                if (Class) {
                    this.trackClass(Class, {
                        name: Class,
                        description,
                        file: file.file,
                        extends: parentClasses,
                        abstract,
                    });
                }
                if (method) {
                    if (currentClass) {
                        this.trackMethod(currentClass, method, {
                            name: method,
                            description,
                            access,
                            params,
                            returns,
                        }, comment);
                    }
                    else {
                        // If we're not in the context of a class, we can't associate the method
                        // with any class. The analysis assumes that a class comment was first
                        // encountered in the same file as the current method.
                        //
                        // TODO In the future we should support things like @memberOf which would allow, for example, a
                        // method to be associated with a class regardless of source order.
                        orphanPropertyOrMethodWarning('method', comment, method);
                    }
                }
                if (property) {
                    if (currentClass) {
                        this.trackProperty(currentClass, property, {
                            name: property,
                            description,
                            access,
                            type,
                        }, comment);
                    }
                    else {
                        // TODO same as with previous block regarding method, but with properties
                        orphanPropertyOrMethodWarning('property', comment, property);
                    }
                }
                if (funktion) {
                    this.functions.set(funktion, {
                        file: file.file,
                        name: funktion,
                        description,
                        params,
                        returns,
                    });
                }
                // reset for the next comment
                primaryTags = [];
                Class = undefined;
                description = undefined;
                parentClasses = [];
                abstract = false;
                access = 'public';
                foundAccess = false;
                method = undefined;
                funktion = undefined;
                params = [];
                returns = undefined;
                constructor = false;
                property = undefined;
                type = undefined;
            }
            currentClass = '';
        }
        const docsMeta = {
            sourceFolder: folder,
            classes: this.classes,
            functions: this.functions,
        };
        return docsMeta;
    }
    trackClass(Class, meta) {
        const _meta = Object.assign({
            name: '',
            description: '',
            file: '',
            extends: [],
            abstract: false,
            methods: {},
            properties: {},
        }, meta);
        let classInfo = this.classes.get(Class);
        if (!classInfo) {
            this.classes.set(Class, (classInfo = _meta));
        }
        else {
            classInfo.extends.push(..._meta.extends);
            classInfo.abstract = _meta.abstract;
            classInfo.methods = {
                ...classInfo.methods,
                ..._meta.methods,
            };
            classInfo.properties = {
                ...classInfo.properties,
                ..._meta.properties,
            };
        }
    }
    trackMethod(Class, method, meta, comment) {
        const classMeta = this.classes.get(Class);
        if (!classMeta) {
            warningForComment(comment, `Not in context of a class for method "${method}"`);
            return;
        }
        // if a method defintiion already exists, skip this one. We only accept one definition.
        if (classMeta.methods.hasOwnProperty(method)) {
            propertyOrMethodAlreadyExistsWarning('method', comment, Class, method);
            return;
        }
        classMeta.methods[method] = meta;
    }
    trackProperty(Class, property, meta, comment) {
        const classMeta = this.classes.get(Class);
        if (!classMeta) {
            warningForComment(comment, `Not in context of a class for property "${property}"`);
            return;
        }
        // if a method definition already exists, skip this one. We only accept one method definition per class.
        if (classMeta.methods.hasOwnProperty(property)) {
            propertyOrMethodAlreadyExistsWarning('property', comment, Class, property);
            return;
        }
        classMeta.properties[property] = meta;
    }
}
function duplicateTagWarning(part, comment) {
    warningForComment(comment, `
            More than one @${part.tag} primary tag was found in a comment.
            Only the first accurrence will be used.
        `);
}
function multiplePrimaryTagsWarning(comment, primaryTags) {
    warningForComment(comment, `
            Found more than one primary tag in a single comment. Unexpected
            behavior may occurr with documentation output.

            The following tags should not be in the same comment:

            ${primaryTags.map(t => '@' + t).join('\n')}
        `);
}
function orphanPropertyOrMethodWarning(tag, comment, name) {
    warningForComment(comment, `
            Encountered an @${tag} tag named "${name}" outside of the
            context of a class. This most likely means that the ${tag}
            definition did not come after an @class comment in the source
            code order.

            For now, @${tag} comments must follow an @class comment in
            order for the methods to be associated with the class. In the
            future, an @memberOf tag will help alleviate the source-order
            requirement.
        `);
}
function propertyOrMethodAlreadyExistsWarning(tag, comment, name, Class) {
    warningForComment(comment, 
    // prettier-ignore
    // prettier fails badly here
    `
            A ${tag} called '${name}' is already defined for the
            class '${Class}'. This means you probably have two or
            more comments with an @${tag} tag defining the same
            ${tag} name. Only the first definition will be used.

            ${tag === 'method' ? `
				If you meant to define an overloaded method, prefer to
				use type unions in the type definitions of your method
				parameters, all within a single @method comment.
			` : ''}
        `);
}
function warningForComment(comment, message) {
    console.warn(messageWithComment(message, comment));
}
function messageWithComment(message, comment) {
    return trim(message) + '\nThe comment was:\n\n' + reIndentComment(comment.source);
}
/**
 * Converts something like
 *
 *        This is a paragraph
 *           of text with some random indentation
 *       that we want to get rid of.
 *
 * to
 *
 * This is a paragraph
 * of text with some random indentation
 * that we want to get rid of.
 */
function trim(s) {
    return s
        .split('\n')
        .map(l => l.trim())
        .join('\n');
}
// converts something like
//
// /*
//         * @foo {number}
//         * @bar
//         */
//
// to
//
// /*
//  * @foo {number}
//  * @bar
//  */
function reIndentComment(source) {
    return source
        .split('\n')
        .map((line, index) => {
        if (index === 0)
            return line.trim();
        return ' ' + line.trim();
    })
        .join('\n');
}
async function promise(func, ...args) {
    return new Promise((resolve, reject) => {
        func(...args, (e, result) => {
            if (e)
                reject(e);
            resolve(result);
        });
    });
}
export class MarkdownRenderer {
    async render(docsMeta, destination) {
        destination = this.resolveDestination(destination);
        const promises = [];
        await promise(mkdirp, destination);
        for (const [className, classMeta] of docsMeta.classes) {
            const relativeSourceDirectory = path.dirname(classMeta.file).replace(docsMeta.sourceFolder, '');
            const outputDir = path.join(destination, relativeSourceDirectory);
            const outputFile = path.join(outputDir, className + '.md');
            promises.push(promise(mkdirp, outputDir).then(() => fs.promises.writeFile(outputFile, output)));
            // this runs synchronously now in the same tick, while the directory
            // is being made in the previous expression, thus always finishes
            // first.
            const output = this.renderClass(className, classMeta, docsMeta);
        }
        await Promise.all(promises);
    }
    resolveDestination(dest) {
        dest = dest.replace('/', path.sep);
        if (!path.isAbsolute(dest))
            dest = path.resolve(process.cwd(), dest);
        return dest;
    }
    // TODO a numberOfLevels option, to specify how many sub-folders to show in
    // the menu. Currently just showing the top-level folder.
    renderNav(docsMeta, options) {
        let result = '';
        const structure = {};
        for (const [, classMeta] of docsMeta.classes) {
            const relative = path.relative(docsMeta.sourceFolder, classMeta.file);
            // the top-level folder
            // TODO this doesn't handle files in the folder.
            const section = relative.split(path.sep)[0];
            if (!structure[section])
                structure[section] = [];
            structure[section].push(classMeta);
        }
        const linePadStart = (options && options.linePadStart) || '';
        const outputBasePath = (options && options.basePath) || '';
        let relativePath = '';
        for (const section in structure) {
            result += `${linePadStart}- ${section}/\n`;
            for (const classMeta of structure[section]) {
                relativePath = path.relative(docsMeta.sourceFolder, classMeta.file.replace(/\.ts$/, '.md'));
                result += `${linePadStart}  - [${classMeta.name}](${path.join(outputBasePath, relativePath)})\n`;
            }
        }
        return result;
    }
    //////////////////////////////////////////
    renderClass(className, classMeta, docsMeta) {
        const parents = classMeta.extends
            .map(name => {
            // TODO, it may be possible to extend from other things besides
            // a @class. We should provide a way to get any of those things
            // by name, more generic than the docsMeta.classes map.
            const parent = docsMeta.classes.get(name);
            // TODO not all classes are in the docsMeta at this point. Why?
            if (!parent)
                return name;
            // TODO handle the extension (f.e. ".ts") generically
            const link = path.relative(path.dirname(classMeta.file), parent.file.replace(/\.ts$/, '.md'));
            return `[${name}](${link})`;
        })
            .join(', ');
        const properties = Object.entries(classMeta.properties);
        const methods = Object.entries(classMeta.methods);
        // TODO, the Docsify-specific :id=foo stuff should be an extension,
        // while the base should have generic Markdown only.
        return `
# <code>class <b>${className}</b>${parents ? ' extends ' + parents : ''}</code> :id=${className}

${classMeta.description ? classMeta.description : ''}

${properties.length ? '## Properties' : ''}

${parents ? `Inherits properties from ${parents}.` : ''}

${properties.map(([name, meta]) => this.renderProperty(name, meta, docsMeta)).join('\n\n')}

${methods.length ? '## Methods' : ''}

${parents ? `Inherits methods from ${parents}.` : ''}

${methods.map(([name, meta]) => this.renderMethod(name, meta, docsMeta)).join('\n\n')}
        `;
    }
    renderProperty(propertyName, propertyMeta, _docsMeta) {
        const type = propertyMeta.type ? propertyMeta.type.source : '';
        return `
### <code>.<b>${propertyName}</b>${type ? `: ${type}` : ''}</code> :id=${propertyName}

${propertyMeta.description}
        `;
    }
    renderMethod(methodName, methodMeta, _docsMeta) {
        const ret = methodMeta.returns ? methodMeta.returns.source : 'void';
        return `
### <code>.<b>${methodName}</b>(): ${ret}</code> :id=${methodName}

${methodMeta.description
        // TODO handle methodMeta.params, etc
        }
        `;
    }
}
export const version = '0.2.13';
//# sourceMappingURL=index.js.map