"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptchaErrorCodeEnum = exports.CaptchaError = void 0;
/**
 * Custom error class for captcha-related errors
 */
class CaptchaError extends Error {
    constructor(code, message, description = '', data = null) {
        super(message);
        this.name = 'CaptchaError';
        this.code = code;
        this.description = description;
        this.data = data;
        // This is needed because we're extending a built-in class
        Object.setPrototypeOf(this, CaptchaError.prototype);
        // Capture the stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CaptchaError = CaptchaError;
/**
 * Error codes for specific captcha error scenarios
 */
var CaptchaErrorCodeEnum;
(function (CaptchaErrorCodeEnum) {
    CaptchaErrorCodeEnum["ERROR_SOLVING_CAPTCHA"] = "error_solving_captcha";
})(CaptchaErrorCodeEnum || (exports.CaptchaErrorCodeEnum = CaptchaErrorCodeEnum = {}));
