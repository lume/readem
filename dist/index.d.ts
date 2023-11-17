import { Observable } from './Observable.js';
export declare class FileScanner extends Observable {
    scanFile(file: string, charset?: string): Promise<Array<Comment>>;
}
export declare class FolderScanner extends FileScanner {
    scanFolder(folder: string): Promise<FileComments[]>;
}
type Comment = {
    source: string;
    content: CommentContent;
};
type CommentContent = Array<Tag | string>;
type Tag = {
    source: string;
    tag: string;
    type: JSDocTypeAST | undefined;
    name: string | undefined;
    description: string | undefined;
};
type JSDocTypeAST = Record<string, any>;
type FileComments = {
    file: string;
    comments: Comment[];
};
export declare class CommentAnalyzer {
    scanner: FolderScanner;
    classes: Map<string, ClassMeta>;
    functions: Map<string, FunctionMeta>;
    analyze(folder: string, filter?: (path: string) => boolean): Promise<DocsMeta>;
    private trackClass;
    private trackMethod;
    private trackProperty;
}
export type PrimaryItemMeta = {
    file: string;
};
export type ClassMeta = PrimaryItemMeta & {
    name: string;
    description: string;
    extends: string[];
    abstract: boolean;
    properties: Record<string, PropertyMeta>;
    methods: Record<string, MethodMeta>;
};
export type ClassElementMeta = {
    access: 'public' | 'protected' | 'private';
};
export type PropertyMeta = ClassElementMeta & {
    name: string;
    description?: string;
    type?: JSDocTypeAST;
};
export type FunctionLikeMeta = {
    name: string;
    description?: string;
    params: Param[];
    returns?: JSDocTypeAST;
};
export type FunctionMeta = PrimaryItemMeta & FunctionLikeMeta;
export type MethodMeta = ClassElementMeta & FunctionLikeMeta;
export type Param = {
    name: string;
    description?: string;
    type?: JSDocTypeAST;
};
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
export declare const version = "0.2.12";
export {};
//# sourceMappingURL=index.d.ts.map