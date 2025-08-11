"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScrapingUseCase = void 0;
const MediaServices_1 = require("../../data/MediaServices");
class BaseScrapingUseCase {
    execute(currentUser, params) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Template step 1: Execute scraping
                const scrapingParams = this.getScrapingParams(currentUser, params);
                const scrapingFunction = this.getScrapingFunction();
                const { imageBuffers, pdfBuffers, videoBuffers = [], data } = yield scrapingFunction(scrapingParams);
                // Log video buffer information
                console.log(`Video buffers received: ${videoBuffers.length}`);
                videoBuffers.forEach((buffer, index) => {
                    console.log(`Video buffer ${index}: ${buffer ? buffer.length : 'null'} bytes`);
                });
                // Template step 2: Generate unique IDs for files
                const basePath = this.getBasePath(currentUser, params);
                // Template step 3: Prepare files for Cloudinary upload
                const filesToUpload = [
                    // Screenshots
                    ...imageBuffers.map((imageBuffer, index) => ({
                        fileId: `${basePath}/screenshot-${index}.png`,
                        buffer: imageBuffer,
                        options: {
                            resourceType: 'image',
                            accessMode: 'public',
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
                            resourceType: 'raw',
                            accessMode: 'public'
                        }
                    })),
                    // Videos
                    ...videoBuffers.map((videoBuffer, index) => ({
                        fileId: `${basePath}/scraping-video-${index}.mp4`,
                        buffer: videoBuffer,
                        options: {
                            resourceType: 'video',
                            accessMode: 'public',
                            transformation: [
                                { quality: 'auto', fetch_format: 'auto' }
                            ]
                        }
                    }))
                ];
                // Template step 4: Upload files to media service
                const uploadedFiles = yield MediaServices_1.mediaService.uploadFiles(filesToUpload);
                // Template step 5: Separate URLs by type
                const screenshotFiles = uploadedFiles.filter(file => file.id.includes('screenshot'));
                const pdfFiles = uploadedFiles.filter(file => file.id.includes('report'));
                const videoFiles = uploadedFiles.filter(file => file.id.includes('scraping-video'));
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
                // Template step 7: Clear buffers from memory
                imageBuffers.length = 0;
                pdfBuffers.length = 0;
                videoBuffers.length = 0;
                // Template step 8: Return result
                return {
                    imagePathsUrls: imageUrls,
                    pdfPathsUrls: pdfUrls,
                    videoPathsUrls: videoUrls,
                    data
                };
            }
            catch (error) {
                console.error(`Error in ${this.constructor.name}:`, error);
                throw new Error(`${this.getErrorMessage()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
}
exports.BaseScrapingUseCase = BaseScrapingUseCase;
