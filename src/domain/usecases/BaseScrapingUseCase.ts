import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { mediaService } from "../../data/MediaServices";
import { IWebsiteScrappingResult } from "../../websitesScrapping/IWebsiteScrappingResult";

export interface BaseUser {
    userId: string;
}

export interface BaseParams {
    vehicleData: {
        matricula: string;
        [key: string]: any;
    };
    [key: string]: any;
}

export abstract class BaseScrapingUseCase<TData, TParams extends BaseParams, TUser extends BaseUser = BaseUser> {
    protected abstract getScrapingFunction(): (params: TParams) => Promise<IWebsiteScrappingResult<TData>>;
    protected abstract getScrapingParams(currentUser: TUser, params: TParams): TParams;
    protected abstract getBasePath(currentUser: TUser, params: TParams): string;
    protected abstract getErrorMessage(): string;

    public async execute(currentUser: TUser, params: TParams): Promise<IGenerateAndSaveScrappedDataRes<TData>> {
        try {
            // Template step 1: Execute scraping
            const scrapingParams = this.getScrapingParams(currentUser, params);
            const scrapingFunction = this.getScrapingFunction();
            const { imageBuffers, pdfBuffers, data } = await scrapingFunction(scrapingParams);

            // Template step 2: Generate unique IDs for files
            const basePath = this.getBasePath(currentUser, params);

            // Template step 3: Prepare files for Cloudinary upload
            const filesToUpload = [
                // Screenshots
                ...imageBuffers.map((imageBuffer, index) => ({
                    fileId: `${basePath}/screenshot-${index}.png`,
                    buffer: imageBuffer,
                    options: {
                        resourceType: 'image' as const,
                        accessMode: 'authenticated' as const,
                        transformation: [
                            { quality: 'auto', fetch_format: 'auto' },
                            { width: 1200, height: 800, crop: 'limit' }
                        ]
                    }
                })),
                // PDFs
                ...pdfBuffers.map((pdfBuffer, index) => ({
                    fileId: `${basePath}/report-${index}.pdf`,
                    buffer: pdfBuffer,
                    options: {
                        resourceType: 'image' as const,
                        accessMode: 'authenticated' as const
                    }
                }))
            ];

            // Template step 4: Upload files to media service
            const uploadedFiles = await mediaService.uploadFiles(filesToUpload);

            // Template step 5: Separate URLs by type
            const screenshotFiles = uploadedFiles.filter(file => file.id.includes('screenshot'));
            const pdfFiles = uploadedFiles.filter(file => file.id.includes('report'));

            // Template step 6: Get signed URLs
            const imageUrls = await Promise.all(
                screenshotFiles.map(file => mediaService.getSignedUrl(file.id, { 
                    resourceType: 'image',
                    expiresIn: 86400 // 24 hours
                }))
            );

            const pdfUrls = await Promise.all(
                pdfFiles.map(file => mediaService.getSignedUrl(file.id, { 
                    resourceType: 'image',
                    expiresIn: 86400 // 24 hours
                }))
            );

            // Template step 7: Clear buffers from memory
            imageBuffers.length = 0;
            pdfBuffers.length = 0;

            // Template step 8: Return result
            return {
                imagePathsUrls: imageUrls,
                pdfPathsUrls: pdfUrls,
                data
            };

        } catch (error) {
            console.error(`Error in ${this.constructor.name}:`, error);
            throw new Error(`${this.getErrorMessage()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 