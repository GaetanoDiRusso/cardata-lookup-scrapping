"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TWO_CAPTCHA_API_KEY = exports.CAPMONSTER_API_KEY = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
exports.CAPMONSTER_API_KEY = process.env.CAPMONSTER_API_KEY || '';
exports.TWO_CAPTCHA_API_KEY = process.env.TWO_CAPTCHA_API_KEY || '';
// Add some validation to help with debugging
if (!exports.CAPMONSTER_API_KEY) {
    console.warn('Warning: CAPMONSTER_API_KEY is not set in environment variables');
}
if (!exports.TWO_CAPTCHA_API_KEY) {
    console.warn('Warning: TWO_CAPTCHA_API_KEY is not set in environment variables');
}
