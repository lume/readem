import { FileScanner, FolderScanner, CommentAnalyzer, MarkdownRenderer } from './index';
describe('readem', () => {
    it('has classes', () => {
        expect(FileScanner).toBeInstanceOf(Function);
        expect(FolderScanner).toBeInstanceOf(Function);
        expect(CommentAnalyzer).toBeInstanceOf(Function);
        expect(MarkdownRenderer).toBeInstanceOf(Function);
    });
});
//# sourceMappingURL=index.test.js.map