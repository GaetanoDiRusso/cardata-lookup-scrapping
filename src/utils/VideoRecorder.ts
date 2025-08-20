import { PuppeteerScreenRecorder, PuppeteerScreenRecorderOptions } from 'puppeteer-screen-recorder';
import { PassThrough } from 'stream';
import type { Page } from 'puppeteer';

export class VideoRecorder {
    private recorder: PuppeteerScreenRecorder;
    private passThrough: PassThrough;
    private chunks: Buffer[] = [];
    private isRecording: boolean = false;
    private ffmpegPath: string | null = null;
    private isLambda: boolean = false;

    constructor(private page: Page) {
        this.isLambda = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

        // Try to find FFmpeg in Lambda environment
        this.ffmpegPath = this.findFFmpegPath();
        
        this.recorder = new PuppeteerScreenRecorder(page, {
            ffmpeg_Path: this.ffmpegPath || undefined,
        } as PuppeteerScreenRecorderOptions);

        this.passThrough = new PassThrough();
        
        // Set up chunk collection
        this.passThrough.on('data', (chunk) => {
            this.chunks.push(chunk);
        });
    }

    private findFFmpegPath(): string | null {
        if (!this.isLambda) {
            return null;
        }

        // Common FFmpeg paths in Lambda
        const ffmpegPaths = [
            '/opt/bin/ffmpeg',        // ✅ Lambda Layer path (this will work!)
            '/usr/bin/ffmpeg',        // System path (fallback)
            process.env.FFMPEG_PATH || ''    // Environment variable
        ];

        for (const path of ffmpegPaths) {
            try {
                const { execSync } = require('child_process');
                execSync(`test -f "${path}"`, { stdio: 'ignore' });
                console.log('Found FFmpeg at:', path);
                return path;
            } catch {
                continue;
            }
        }

        console.log('FFmpeg not found, video recording may not work');
        return null;
    }

    /**
     * Start recording the page
     */
    async start(): Promise<void> {
        if (this.isRecording) {
            throw new Error('Recording is already in progress');
        }

        if (this.isLambda && !this.ffmpegPath) {
            console.log('Skipping video recording - FFmpeg not available');
            this.isRecording = true;
            return;
        }
        
        try {
            await this.recorder.startStream(this.passThrough);
            this.isRecording = true;
        } catch (error) {
            console.log('Video recording failed, continuing without video:', (error as Error).message);
            this.isRecording = true; // Mark as recording so we can still return empty buffer
        }
    }

    /**
     * Stop recording and return the video buffer
     */
    async stop(): Promise<Buffer> {
        if (!this.isRecording) {
            throw new Error('No recording in progress');
        }

        if (this.ffmpegPath || !this.isLambda) {
            try {
                await this.recorder.stop();
            } catch (error) {
                console.log('Error stopping video recorder:', (error as Error).message);
            }
        }

        this.isRecording = false;

        // Combine all chunks into a single buffer
        const videoBuffer = this.chunks.length > 0 ? Buffer.concat(this.chunks) : Buffer.alloc(0);
        
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