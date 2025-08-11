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
exports.solveCaptchaV2 = void 0;
const constants_1 = require("../../constants");
const CaptchaError_1 = require("../CaptchaError");
const node_two_captcha_1 = __importDefault(require("@infosimples/node_two_captcha"));
let captchaClient;
const getCaptchaClient = () => {
    if (!captchaClient) {
        captchaClient = new node_two_captcha_1.default(constants_1.TWO_CAPTCHA_API_KEY, {
            timeout: 180000,
            polling: 5000,
            throwErrors: false
        });
    }
    return captchaClient;
};
const solveCaptchaV2 = (captchaData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const captchaClient = getCaptchaClient();
        const captchaResponse = yield captchaClient.decodeRecaptchaV2({
            googlekey: captchaData.key,
            pageurl: captchaData.url
        });
        if (!captchaResponse.text) {
            throw new CaptchaError_1.CaptchaError(CaptchaError_1.CaptchaErrorCodeEnum.ERROR_SOLVING_CAPTCHA, 'Error solving captcha :: 2Captcha :: ' + captchaResponse.error);
        }
        return captchaResponse.text;
    }
    catch (error) {
        if (error instanceof CaptchaError_1.CaptchaError) {
            throw error;
        }
        throw new CaptchaError_1.CaptchaError(CaptchaError_1.CaptchaErrorCodeEnum.ERROR_SOLVING_CAPTCHA, 'Error solving captcha :: 2Captcha :: ' + error);
    }
});
exports.solveCaptchaV2 = solveCaptchaV2;
