export interface IGenerateAndSaveScrappedDataRes<T> {
    imagePathsUrls: string[];
    pdfPathsUrls: string[];
    data: T;
}