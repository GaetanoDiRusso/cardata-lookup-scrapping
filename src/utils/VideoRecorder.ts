import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import { PassThrough } from 'stream';
import type { Page } from 'puppeteer';

export class VideoRecorder {
    private recorder: PuppeteerScreenRecorder;
    private passThrough: PassThrough;
    private chunks: Buffer[] = [];
    private isRecording: boolean = false;

    constructor(private page: Page) {
        this.recorder = new PuppeteerScreenRecorder(page);
        this.passThrough = new PassThrough();
        
        // Set up chunk collection
        this.passThrough.on('data', (chunk) => {
            this.chunks.push(chunk);
        });
    }

    /**
     * Start recording the page
     */
    async start(): Promise<void> {
        if (this.isRecording) {
            throw new Error('Recording is already in progress');
        }
        
        await this.recorder.startStream(this.passThrough);
        this.isRecording = true;
    }

    /**
     * Stop recording and return the video buffer
     */
    async stop(): Promise<Buffer> {
        if (!this.isRecording) {
            throw new Error('No recording in progress');
        }

        await this.recorder.stop();
        this.isRecording = false;

        // Combine all chunks into a single buffer
        const videoBuffer = Buffer.concat(this.chunks);
        
        // Clear chunks to free memory
        this.chunks = [];
        
        return videoBuffer;
    }

    /**
     * Check if recording is currently active
     */
    get recording(): boolean {
        return this.isRecording;
    }

    /**
     * Get current recording duration (if needed)
     */
    get duration(): number {
        // This could be enhanced to track actual recording time
        return this.chunks.length > 0 ? this.chunks.length : 0;
    }

    /**
     * Clean up resources
     */
    async cleanup(): Promise<void> {
        if (this.isRecording) {
            await this.stop();
        }
        
        // Clear any remaining chunks
        this.chunks = [];
        
        // Destroy the pass through stream
        this.passThrough.destroy();
    }
} 