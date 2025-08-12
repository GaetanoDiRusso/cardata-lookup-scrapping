import { LogEntry } from "./Logger";

export interface IGenerateAndSaveScrappedDataRes<T> {
    imagePathsUrls: string[];
    pdfPathsUrls: string[];
    videoPathsUrls: string[];
    data: T;
    logs: LogEntry[];
    success: boolean;
    error?: string;
}