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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScrapingProcess = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const VideoRecorder_1 = require("../utils/VideoRecorder");
class BaseScrapingProcess {
    launchBrowser() {
        return __awaiter(this, arguments, void 0, function* (headless = true) {
            return yield puppeteer_1.default.launch({
                headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        });
    }
    execute(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, headless = true) {
            const browser = yield this.launchBrowser(headless);
            let videoRecorder = null;
            try {
                const page = yield browser.newPage();
                yield page.setViewport({ width: 1280, height: 800 });
                // Initialize video recorder
                videoRecorder = new VideoRecorder_1.VideoRecorder(page);
                yield videoRecorder.start();
                // Perform the actual scraping (implemented by subclasses)
                const result = yield this.performScraping(page, data);
                // Stop recording and get video buffer
                const videoBuffer = yield videoRecorder.stop();
                return Object.assign(Object.assign({}, result), { videoBuffers: [videoBuffer] });
            }
            catch (error) {
                console.error('Error in scraping process:', error);
                throw error;
            }
            finally {
                // Clean up video recorder
                if (videoRecorder) {
                    yield videoRecorder.cleanup();
                }
                yield browser.close();
            }
        });
    }
}
exports.BaseScrapingProcess = BaseScrapingProcess;
