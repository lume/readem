import { Observable } from './Observable.js';
export declare class FileScanner extends Observable {
    scanFile(file: string, charset?: string): Promise<Array<Comment>>;
}
export declare class FolderScanner extends FileScanner {
    scanFolder(folder: string): Promise<FileComments[]>;
}
declare type Comment = {
    source: string;
    content: CommentContent;
};
declare type CommentContent = Array<Tag | string>;
declare type Tag = {
    source: string;
    tag: string;
    type: JSDocTypeAST | undefined;
    name: string | undefined;
    description: string | undefined;
};
declare type JSDocTypeAST = Record<string, any>;
declare type FileComments = {
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
export declare type PrimaryItemMeta = {
    file: string;
};
export declare type ClassMeta = PrimaryItemMeta & {
    name: string;
    description: string;
    extends: string[];
    abstract: boolean;
    properties: Record<string, PropertyMeta>;
    methods: Record<string, MethodMeta>;
};
export declare type ClassElementMeta = {
    access: 'public' | 'protected' | 'private';
};
export declare type PropertyMeta = ClassElementMeta & {
    name: string;
    description?: string;
    type?: JSDocTypeAST;
};
export declare type FunctionLikeMeta = {
    name: string;
    description?: string;
    params: Param[];
    returns?: JSDocTypeAST;
};
export declare type FunctionMeta = PrimaryItemMeta & FunctionLikeMeta;
export declare type MethodMeta = ClassElementMeta & FunctionLikeMeta;
export declare type Param = {
    name: string;
    description?: string;
    type?: JSDocTypeAST;
};
export declare type DocsMeta = {
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
export declare const version = "0.2.7";
export {};
//# sourceMappingURL=index.d.ts.map