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
exports.solveCaptchaV2 = void 0;
const capmonstercloud_client_1 = require("@zennolab_com/capmonstercloud-client");
const constants_1 = require("../../constants");
const CaptchaError_1 = require("../CaptchaError");
const solveCaptchaV2 = (captchaData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log("Solving captcha :: CapMonster :: " + captchaData.url);
        const cmcClient = capmonstercloud_client_1.CapMonsterCloudClientFactory.Create(new capmonstercloud_client_1.ClientOptions({ clientKey: constants_1.CAPMONSTER_API_KEY }));
        const recaptchaV2ProxylessRequest = new capmonstercloud_client_1.RecaptchaV2ProxylessRequest({
            websiteURL: captchaData.url,
            websiteKey: captchaData.key,
        });
        const res = yield cmcClient.Solve(recaptchaV2ProxylessRequest);
        if (!((_a = res.solution) === null || _a === void 0 ? void 0 : _a.gRecaptchaResponse)) {
            throw new CaptchaError_1.CaptchaError(CaptchaError_1.CaptchaErrorCodeEnum.ERROR_SOLVING_CAPTCHA, 'Error solving captcha :: CapMonster :: ' + res.error);
        }
        return (_b = res.solution) === null || _b === void 0 ? void 0 : _b.gRecaptchaResponse;
    }
    catch (error) {
        if (error instanceof CaptchaError_1.CaptchaError) {
            throw error;
        }
        throw new CaptchaError_1.CaptchaError(CaptchaError_1.CaptchaErrorCodeEnum.ERROR_SOLVING_CAPTCHA, 'Error solving captcha :: CapMonster :: ' + error);
    }
});
exports.solveCaptchaV2 = solveCaptchaV2;
