import { Observable } from './Observable.js';
/**
 * @class FileScanner - Scans files for JSDoc-style comments, outputting usable
 * objects representing the found tags.
 * @extends Observable
 */
export declare class FileScanner extends Observable {
    /**
     * @method scanFile - Scans a file and triggers the 'comment' for each comment
     * that the scanner parsers while scanning the file.
     * @param {string} file - The file to scan. If not absolute, will be
     * relative to the current working directory.
     * @param {string} [charset] - The character set of the file. Defaults to "utf8"
     * @returns {Promise<Array<Comment>>} - A promise for when done scanning the file.
     */
    scanFile(file: string, charset?: string): Promise<Array<Comment>>;
}
/**
 * @class FolderScanner - Scans specified folders for JSDoc-style comments within files.
 * @extends FileScanner
 */
export declare class FolderScanner extends FileScanner {
    /**
     * @method scanFolder - Scans a folder and all sub-folders any level deep
     * for all JSDoc-like comments in files.
     * @param {string} folder - The folder to scan.
     * @returns {Promise<FileComments[]>} - A promise that resolves to an array
     * of objects, each one containing the normalized comments found in a file
     * of the given folder.
     */
    scanFolder(folder: string): Promise<FileComments[]>;
}
/**
 * @typedef {Object} Comment
 * @property {string} source - The original comment as found in the source
 * @property {CommentContent} content - An array of objects representing each tag (or non-tag) found in the comment
 */
type Comment = {
    source: string;
    content: CommentContent;
};
/**
 * @typedef {Array<Tag | string>} CommentContent - An array of items
 * representing the parts found inside a comment. The items can be either `Tag`
 * objects representing any tag blocks that are found, or strings representing
 * any other content (f.e. text at the top of a comment which is not a tag
 * block). @
 *
 * TODO link to the Tag type in the description.
 */
type CommentContent = Array<Tag | string>;
/**
 * @typedef {Object} Tag - An object representing the content found in a tag block. Some properties will be `undefined` if not found.
 * @property {string} source - The original content of the tag as found in the source, f.e. `@@param {string} foo - the description`
 * @property {string} tag - The tag name, f.e. `param` in `@@param {string} foo - the description`
 * @property {JSDocTypeAST | undefined} type - The type, f.e. `string` in
 * `@@param {string} foo - the description` get represented as an AST object.
 * See [`JSDocTypeAST`](#JSDocTypeAST) for more info.
 * @property {string | undefined} name - The name of the thing being documented, f.e. `foo` in `@@param {string} foo - the description`
 * @property {string | undefined} description - The name of the thing being documented, f.e. `the description` in `@@param {string} foo - the description`
 */
type Tag = {
    source: string;
    tag: string;
    type: JSDocTypeAST | undefined;
    name: string | undefined;
    description: string | undefined;
};
/**
 * @typedef {Object} JSDocTypeAST - This is an object which is the AST
 * representation of the content found between curly braces of a JSDoc tag
 * type. See the `jsdoctypeparser` package for documentation on the structure
 * of the type AST object. Additionally, each object has a `source` property
 * containing the original source of the type text. If jsdoctypeparser doesn't
 * understand the syntax, then instead letting an error be thrown, the
 * resulting object will have a property "type" with value of "unknown", along
 * with the "source" property containing the original text.
 *
 * Byhaving the `source` property always present in the object, this allows the
 * consumer of the output to choose not to use the AST, and do what they want
 * with the original text.
 */
type JSDocTypeAST = Record<string, any>;
/**
 * @typedef {{file: string, comments: Comment[]}} FileComments
 */
type FileComments = {
    file: string;
    comments: Comment[];
};
/**
 * @class Docs - scans a directory for comments, analyzes them to create
 * hierarchy of classes, etc, and finally outputs them using a template.
 */
export declare class CommentAnalyzer {
    /**
     * @property {FolderScanner} scanner - The scanner used to scan the
     * filesystem for comments in source files.
     */
    scanner: FolderScanner;
    /**
     * @property {Map<string, ClassMeta>} classes - contains information for
     * classes that are documented in the scanned comments. This is empty at
     * first, and will have been populated after a call to the `.analyze()`
     * method on a directory containing documented source has completed.
     * `classes` is a map of class name to `ClassMeta` object containing
     * information about the class. See the `ClassMeta` type for details.
     */
    classes: Map<string, ClassMeta>;
    functions: Map<string, FunctionMeta>;
    /**
     * @method analyze
     * @param {string} folder - The directory that contains whose source files
     * will be scanned for JSDoc-like comments and then analyzed for
     * documentation.
     * @param {(path: string) => boolean} filter - A function that returns `true`
     * if a file should be included, or false otherwise.
     * @returns {Promise<undefined>}
     */
    analyze(folder: string, filter?: (path: string) => boolean): Promise<DocsMeta>;
    private trackClass;
    private trackMethod;
    private trackProperty;
}
/**
 * @typedef {{ file: string }} PrimaryItemMeta - The base Meta type for
 * top-level items such as classes, objects, functions, etc. These primary
 * items are associated with files where they are found. Other types of
 * secondary items like methods or properties are associated with these primary
 * items instead of with files.
 */
export type PrimaryItemMeta = {
    file: string;
};
/**
 * @typedef {PrimaryItemMeta & {
 *   name: string,
 *   description: string,
 *   extends: string[],
 *   abstract: boolean,
 *   methods: Record<string, MethodMeta>,
 *   properties: Record<string, PropertyMeta>
 * }} ClassMeta - Information that describes a class (a top-level primary item
 * that may contain secondary items that describe properties and methods).
 */
export type ClassMeta = PrimaryItemMeta & {
    name: string;
    description: string;
    extends: string[];
    abstract: boolean;
    properties: Record<string, PropertyMeta>;
    methods: Record<string, MethodMeta>;
};
/**
 * @typedef {{ access: 'public' | 'protected' | 'private' }} ClassElementMeta - Base type for secondary items such as properties or methods of a primary ClassMeta item.
 */
export type ClassElementMeta = {
    access: 'public' | 'protected' | 'private';
};
/**
 * @typedef {ClassElementMeta & {
 *   name: string,
 *   description: string,
 *   type: JSDocTypeAST | undefined
 * }} MethodMeta
 */
export type PropertyMeta = ClassElementMeta & {
    name: string;
    description?: string;
    type?: JSDocTypeAST;
};
/**
 * @typedef {{ name: string, description?: string, params: Param[], returns?: JSDocTypeAST }} FunctionLikeMeta - Base type for function-like items such as functions and methods.
 */
export type FunctionLikeMeta = {
    name: string;
    description?: string;
    params: Param[];
    returns?: JSDocTypeAST;
};
/**
 * @typedef {PrimaryItemMeta & FunctionLikeMeta} FunctionMeta
 */
export type FunctionMeta = PrimaryItemMeta & FunctionLikeMeta;
/**
 * @typedef {ClassElementMeta & FunctionLikeMeta} MethodMeta
 */
export type MethodMeta = ClassElementMeta & FunctionLikeMeta;
/**
 * @typedef {{ name: string, description: string, type: JSDocTypeAST | undefined }} Param
 */
export type Param = {
    name: string;
    description?: string;
    type?: JSDocTypeAST;
};
/**
 * @typedef DocsMeta - The overall information that was gleaned from source comments.
 * @property {string} sourceFolder - The root folder of the project being scanned for doc comments.
 * @property {Map<string, ClassMeta>} classes - A map of class names to ClassMeta objects with details about the classes documented in the source.
 * @property {Map<string, FunctionMeta>} functions - A map of class names to ClassMeta objects with details about the classes documented in the source.
 */
export type DocsMeta = {
    sourceFolder: string;
    classes: Map<string, ClassMeta>;
    functions: Map<string, FunctionMeta>;
};
export declare class MarkdownRenderer {
    render(docsMeta: DocsMeta, destination: string): Promise<void>;
    private resolveDestination;
    renderNav(docsMeta: DocsMeta, options?: {
        linePadStart?: string;
        basePath?: string;
    }): string;
    renderClass(className: string, classMeta: ClassMeta, docsMeta: DocsMeta): string;
    renderProperty(propertyName: string, propertyMeta: PropertyMeta, _docsMeta: DocsMeta): string;
    renderMethod(methodName: string, methodMeta: MethodMeta, _docsMeta: DocsMeta): string;
}
export declare const version = "0.2.13";
export {};
//# sourceMappingURL=index.d.ts.map