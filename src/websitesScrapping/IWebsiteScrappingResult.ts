export interface IWebsiteScrappingResult<T> {
    imagePaths: Buffer[];
    pdfPaths: Buffer[];
    data: T;
}