export interface IWebsiteScrappingResult<T> {
    imageBuffers: Buffer[];
    pdfBuffers: Buffer[];
    videoBuffers?: Buffer[];
    data: T;
    success: boolean;
    error?: string;
}