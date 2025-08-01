export interface IWebsiteScrappingResult<T> {
    imageBuffers: Buffer[];
    pdfBuffers: Buffer[];
    data: T;
}