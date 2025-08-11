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
exports.VideoRecorder = void 0;
const puppeteer_screen_recorder_1 = require("puppeteer-screen-recorder");
const stream_1 = require("stream");
class VideoRecorder {
    constructor(page) {
        this.page = page;
        this.chunks = [];
        this.isRecording = false;
        this.recorder = new puppeteer_screen_recorder_1.PuppeteerScreenRecorder(page);
        this.passThrough = new stream_1.PassThrough();
        // Set up chunk collection
        this.passThrough.on('data', (chunk) => {
            this.chunks.push(chunk);
        });
    }
    /**
     * Start recording the page
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRecording) {
                throw new Error('Recording is already in progress');
            }
            yield this.recorder.startStream(this.passThrough);
            this.isRecording = true;
        });
    }
    /**
     * Stop recording and return the video buffer
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isRecording) {
                throw new Error('No recording in progress');
            }
            yield this.recorder.stop();
            this.isRecording = false;
            // Combine all chunks into a single buffer
            const videoBuffer = Buffer.concat(this.chunks);
            // Clear chunks to free memory
            this.chunks = [];
            return videoBuffer;
        });
    }
    /**
     * Check if recording is currently active
     */
    get recording() {
        return this.isRecording;
    }
    /**
     * Get current recording duration (if needed)
     */
    get duration() {
        // This could be enhanced to track actual recording time
        return this.chunks.length > 0 ? this.chunks.length : 0;
    }
    /**
     * Clean up resources
     */
    cleanup() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRecording) {
                yield this.stop();
            }
            // Clear any remaining chunks
            this.chunks = [];
            // Destroy the pass through stream
            this.passThrough.destroy();
        });
    }
}
exports.VideoRecorder = VideoRecorder;
