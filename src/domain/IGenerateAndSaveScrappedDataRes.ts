export interface IGenerateAndSaveScrappedDataRes<T> {
    imagePathsUrls: string[];
    pdfPathsUrls: string[];
    videoPathsUrls: string[];
    data: T;
}