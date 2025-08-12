import puppeteer from 'puppeteer';
import type { Page } from 'puppeteer';
import { IWebsiteScrappingResult } from './IWebsiteScrappingResult';
import { VideoRecorder } from '../utils/VideoRecorder';
import { Logger } from '../domain/Logger';

export abstract class BaseScrapingProcess<TData, TResult> {
    protected abstract performScraping(page: Page, data: TData, logger: Logger): Promise<{
        imageBuffers: Buffer[];
        pdfBuffers: Buffer[];
        data: TResult;
    }>;

    protected async launchBrowser() {
        return await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async execute(data: TData, logger: Logger): Promise<IWebsiteScrappingResult<TResult>> {
        logger.info('Starting to launch browser', { data });

        const browser = await this.launchBrowser();
        let videoRecorder: VideoRecorder | null = null;

        let page: Page | null = null;

        logger.info('Browser launched successfully');

        try {
            page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            logger.info('Page created successfully');

            // Initialize video recorder
            videoRecorder = new VideoRecorder(page);
            await videoRecorder.start();

            logger.info('Video recorder started successfully');

            // Perform the actual scraping (implemented by subclasses)
            const result = await this.performScraping(page, data, logger);

            logger.info('Scraping completed successfully', { resultData: result.data, imageBuffersLength: result.imageBuffers.length, pdfBuffersLength: result.pdfBuffers.length });

            // Stop recording and get video buffer
            const videoBuffer = await videoRecorder.stop();

            logger.info('Video recorder stopped successfully', { videoBufferLength: videoBuffer?.length });

            return {
                ...result,
                videoBuffers: [videoBuffer],
                success: true,
                error: undefined
            };
        } catch (error) {
            logger.error('Error in scraping process', { error });

            const videoBuffer = await videoRecorder?.stop();

            logger.info('Video recorder stopped successfully after error', { videoBufferLength: videoBuffer?.length });

            return {
                imageBuffers: [],
                pdfBuffers: [],
                videoBuffers: videoBuffer ? [videoBuffer] : [],
                data: {} as TResult,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        } finally {
            // Clean up video recorder
            if (videoRecorder) {
                await videoRecorder.cleanup();
            }
            await browser.close();

            logger.info('Browser closed successfully');
        }
    }
} 