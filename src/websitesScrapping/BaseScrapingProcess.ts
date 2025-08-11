import puppeteer from 'puppeteer';
import type { Page } from 'puppeteer';
import { IWebsiteScrappingResult } from './IWebsiteScrappingResult';
import { VideoRecorder } from '../utils/VideoRecorder';

export abstract class BaseScrapingProcess<TData, TResult> {
    protected abstract performScraping(page: Page, data: TData): Promise<{
        imageBuffers: Buffer[];
        pdfBuffers: Buffer[];
        data: TResult;
    }>;

    protected async launchBrowser(headless: boolean = true) {
        return await puppeteer.launch({
            headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async execute(data: TData, headless: boolean = true): Promise<IWebsiteScrappingResult<TResult>> {
        const browser = await this.launchBrowser(headless);
        let videoRecorder: VideoRecorder | null = null;

        let page: Page | null = null;

        try {
            page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            // Initialize video recorder
            videoRecorder = new VideoRecorder(page);
            await videoRecorder.start();

            // Perform the actual scraping (implemented by subclasses)
            const result = await this.performScraping(page, data);

            // Stop recording and get video buffer
            const videoBuffer = await videoRecorder.stop();

            return {
                ...result,
                videoBuffers: [videoBuffer],
                success: true,
                error: undefined
            };
        } catch (error) {
            console.error('Error in scraping process:', error);

            const videoBuffer = await videoRecorder?.stop();

            // const errorScreenshotBuffer = await page?.screenshot({ fullPage: true });

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
        }
    }
} 