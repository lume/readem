import * as fs from 'fs';
import * as path from 'path';
import walker from 'at-at';
import mkdirp from 'mkdirp';
import jsdocTypeParse from 'jsdoctypeparser';
import { Observable } from './Observable.js';
export class FileScanner extends Observable {
    async scanFile(file, charset = 'utf8') {
        let content = await fs.promises.readFile(path.resolve(file), { encoding: charset });
        if (typeof content !== 'string')
            content = content.toString();
        const comments = [];
        const re = doubleStarCommentBlockRegex;
        let commentMatch;
        while ((commentMatch = re.exec(content))) {
            const originalComment = commentMatch[0];
            const comment = {
                source: originalComment,
                content: [],
            };
            const commentContent = commentMatch[1].replace(leadingStarsRegex, '');
            const re = jsDocTagRegex;
            let tagMatch;
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
export class FolderScanner extends FileScanner {
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
const doubleStarCommentBlockRegex = /\/\*\*((?:\s|\S)*?)\*\//g;
const leadingStarsRegex = /^[^\S\r\n]*\*[^\S\r\n]?/gm;
const jsDocTagRegex = /(?<=^[^\S\r\n]*)(?:(?:@([a-zA-Z]+))(?:[^\S\r\n]*(?:{(.*)}))?(?:[^\S\r\n]*((?:[^@\s-]|@@)+))?(?:[^\S\r\n]*(?:-[^\S\r\n]*)?((?:[^@]|@@)*))?)/gm;
export class CommentAnalyzer {
    scanner = new FolderScanner();
    classes = new Map();
    functions = new Map();
    async analyze(folder, filter) {
        folder = folder.endsWith('/') ? folder : folder + '/';
        const result = await this.scanner.scanFolder(folder);
        for (const file of result) {
            if (filter && !filter(file.file))
                continue;
            let currentClass = undefined;
            for (const comment of file.comments) {
                let primaryTags = [];
                let Class = undefined;
                let description = undefined;
                let parentClasses = [];
                let abstract = false;
                let access = 'public';
                let foundAccess = false;
                let method = undefined;
                let funktion = undefined;
                let params = [];
                let returns = undefined;
                let constructor = false;
                let property = undefined;
                let type = undefined;
                for (const part of comment.content) {
                    if (typeof part === 'string') {
                    }
                    else {
                        switch (part.tag) {
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
                            case 'inherits':
                            case 'extends': {
                                if (part.name && !parentClasses.includes(part.name))
                                    parentClasses.push(part.name);
                                break;
                            }
                            case 'abstract': {
                                abstract = true;
                                break;
                            }
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
                            case 'return':
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
                            case 'typedef': {
                                description = part.description;
                                break;
                            }
                        }
                    }
                }
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
    warningForComment(comment, `
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
function trim(s) {
    return s
        .split('\n')
        .map(l => l.trim())
        .join('\n');
}
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
    renderNav(docsMeta, options) {
        let result = '';
        const structure = {};
        for (const [, classMeta] of docsMeta.classes) {
            const relative = path.relative(docsMeta.sourceFolder, classMeta.file);
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
    renderClass(className, classMeta, docsMeta) {
        const parents = classMeta.extends
            .map(name => {
            const parent = docsMeta.classes.get(name);
            if (!parent)
                return name;
            const link = path.relative(path.dirname(classMeta.file), parent.file.replace(/\.ts$/, '.md'));
            return `[${name}](${link})`;
        })
            .join(', ');
        const properties = Object.entries(classMeta.properties);
        const methods = Object.entries(classMeta.methods);
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

${methodMeta.description}
        `;
    }
}
export const version = '0.2.12';
//# sourceMappingURL=index.js.map