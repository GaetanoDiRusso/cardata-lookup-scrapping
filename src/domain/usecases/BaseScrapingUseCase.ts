import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { mediaService } from "../../data/MediaServices";
import { IWebsiteScrappingResult } from "../../websitesScrapping/IWebsiteScrappingResult";
import { Logger } from "../Logger";

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
    protected abstract getScrapingFunction(): (params: TParams, logger: Logger) => Promise<IWebsiteScrappingResult<TData>>;
    protected abstract getScrapingParams(currentUser: TUser, params: TParams): TParams;
    protected abstract getBasePath(currentUser: TUser, params: TParams): string;
    protected abstract getErrorMessage(): string;

    public async execute(currentUser: TUser, params: TParams): Promise<IGenerateAndSaveScrappedDataRes<TData>> {
        try {
            const logger = new Logger(currentUser.userId, this.constructor.name);

            // Template step 1: Execute scraping
            const scrapingParams = this.getScrapingParams(currentUser, params);
            logger.info('Starting scraping use case execution', {
                currentUser,
                params,
            });

            const scrapingFunction = this.getScrapingFunction();
            const { imageBuffers = [], pdfBuffers = [], videoBuffers = [], data, success, error } = await scrapingFunction(scrapingParams, logger);

            if (!success) {
                logger.error('Scraping use case execution failed', {
                    error,
                    imageBuffersLength: imageBuffers.length,
                    pdfBuffersLength: pdfBuffers.length,
                    videoBuffersLength: videoBuffers.length,
                    data,
                });
                this.handleFailedScraping(currentUser, params, imageBuffers, pdfBuffers, videoBuffers, logger, error);

                return {
                    imagePathsUrls: [],
                    pdfPathsUrls: [],
                    videoPathsUrls: [],
                    data,
                    logs: logger.getLogs(),
                    success: false,
                    error: error || 'Scraping failed'
                }
            }

            logger.info('Scraping use case execution completed successfully', {
                imageBuffersLength: imageBuffers.length,
                pdfBuffersLength: pdfBuffers.length,
                videoBuffersLength: videoBuffers.length,
                data,
                success,
                error
            });

            // Template step 2: Generate unique IDs for files
            const basePath = this.getBasePath(currentUser, params);

            logger.info('Base path generated successfully', { basePath });

            // Template step 3: Prepare files for Cloudinary upload
            const filesToUpload = [
                // Screenshots
                ...imageBuffers
                    .filter(buffer => buffer && buffer.length > 0)
                    .map((imageBuffer, index) => ({
                        fileId: `${basePath}/screenshot-${index}.png`,
                        buffer: imageBuffer,
                        options: {
                            resourceType: 'image' as const,
                            accessMode: 'public' as const,
                            transformation: [
                                { quality: 'auto', fetch_format: 'auto' },
                                { width: 1200, height: 800, crop: 'limit' }
                            ]
                        }
                    })),
                // PDFs
                ...pdfBuffers
                    .filter(buffer => buffer && buffer.length > 0)
                    .map((pdfBuffer, index) => ({
                        fileId: `${basePath}/report-${index}.pdf`,
                        buffer: pdfBuffer,
                        options: {
                            resourceType: 'raw' as const,
                            accessMode: 'public' as const
                        }
                    })),
                // Videos
                ...videoBuffers
                    .filter(buffer => buffer && buffer.length > 0)
                    .map((videoBuffer, index) => ({
                        fileId: `${basePath}/scraping-video-${index}.mp4`,
                        buffer: videoBuffer,
                        options: {
                            resourceType: 'video' as const,
                            accessMode: 'public' as const,
                            transformation: [
                                { quality: 'auto', fetch_format: 'auto' }
                            ]
                        }
                    }))
            ];

            logger.info('Files prepared for upload successfully', { filesIdsToUpload: filesToUpload.map(file => file.fileId) });

            // Template step 4: Upload files to media service
            const uploadedFiles = await mediaService.uploadFiles(filesToUpload);

            logger.info('Files uploaded successfully', { uploadedFilesIds: uploadedFiles.map(file => file.id) });

            // Template step 5: Separate URLs by type
            const screenshotFiles = uploadedFiles.filter(file => file.id.includes('screenshot'));
            const pdfFiles = uploadedFiles.filter(file => file.id.includes('report'));
            const videoFiles = uploadedFiles.filter(file => file.id.includes('scraping-video'));

            logger.info('Files separated by type successfully', { screenshotFilesIds: screenshotFiles.map(file => file.id), pdfFilesIds: pdfFiles.map(file => file.id), videoFilesIds: videoFiles.map(file => file.id) });

            // // Template step 6: Get signed URLs
            // const imageUrls = await Promise.all(
            //     screenshotFiles.map(file => mediaService.getSignedUrl(file.id, { 
            //         resourceType: 'image',
            //         expiresIn: 86400 // 24 hours
            //     }))
            // );

            // const pdfUrls = await Promise.all(
            //     pdfFiles.map(file => mediaService.getSignedUrl(file.id, { 
            //         resourceType: 'raw',
            //         expiresIn: 86400 // 24 hours
            //     }))
            // );

            // const videoUrls = await Promise.all(
            //     videoFiles.map(file => mediaService.getSignedUrl(file.id, { 
            //         resourceType: 'video',
            //         expiresIn: 86400 // 24 hours
            //     }))
            // );

            const imageUrls = screenshotFiles.map(file => file.url);
            const pdfUrls = pdfFiles.map(file => file.url);
            const videoUrls = videoFiles.map(file => file.url);

            logger.info('Files separated by type successfully', { imageUrls, pdfUrls, videoUrls });

            // Template step 7: Clear buffers from memory
            imageBuffers.length = 0;
            pdfBuffers.length = 0;
            videoBuffers.length = 0;

            // Template step 8: Return result
            return {
                imagePathsUrls: imageUrls,
                pdfPathsUrls: pdfUrls,
                videoPathsUrls: videoUrls,
                data,
                logs: logger.getLogs(),
                success: true
            };

        } catch (error) {
            console.error(`Error in ${this.constructor.name}:`, error);
            throw new Error(`${this.getErrorMessage()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async handleFailedScraping(currentUser: TUser, params: TParams, imageBuffers: Buffer[], pdfBuffers: Buffer[], videoBuffers: Buffer[], logger: Logger, error?: string) {
        const basePath = this.getBasePath(currentUser, params);

        logger.error('Starting to handle failed scraping', {
            error,
            imageBuffersLength: imageBuffers.length,
            pdfBuffersLength: pdfBuffers.length,
            videoBuffersLength: videoBuffers.length,
        });

        const filesToUpload = [
            ...imageBuffers
                .filter(buffer => buffer && buffer.length > 0)
                .map((imageBuffer, index) => ({
                    fileId: `${basePath}/failed-screenshot-${index}.png`,
                    buffer: imageBuffer,
                    options: {
                        resourceType: 'image' as const,
                        accessMode: 'public' as const,
                        transformation: [
                            { quality: 'auto', fetch_format: 'auto' },
                            { width: 1200, height: 800, crop: 'limit' }
                        ]
                    }
                })),
            ...pdfBuffers
                .filter(buffer => buffer && buffer.length > 0)
                .map((pdfBuffer, index) => ({
                    fileId: `${basePath}/failed-report-${index}.pdf`,
                    buffer: pdfBuffer,
                    options: {
                        resourceType: 'raw' as const,
                        accessMode: 'public' as const
                    }
                })),
            ...videoBuffers
                .filter(buffer => buffer && buffer.length > 0)
                .map((videoBuffer, index) => ({
                    fileId: `${basePath}/failed-scraping-video-${index}.mp4`,
                    buffer: videoBuffer,
                    options: {
                        resourceType: 'video' as const,
                        accessMode: 'public' as const,
                        transformation: [
                            { quality: 'auto', fetch_format: 'auto' }
                        ]
                    }
                }))
        ];

        const uploadedFiles = await mediaService.uploadFiles(filesToUpload);

        logger.info('Failed scraping files uploaded successfully', {
            uploadedFiles: {
                imageUrls: uploadedFiles.filter(file => file.id.includes('failed-screenshot')).map(file => file.url),
                pdfUrls: uploadedFiles.filter(file => file.id.includes('failed-report')).map(file => file.url),
                videoUrls: uploadedFiles.filter(file => file.id.includes('failed-scraping-video')).map(file => file.url),
            }
        });
    }
} 