type CaptchaErrorData = {
    key: string;
    url: string;
}

/**
 * Custom error class for captcha-related errors
 */
export class CaptchaError extends Error {
    public readonly code: CaptchaErrorCodeEnum;
    public readonly description: string;
    public readonly data: CaptchaErrorData | null;

    constructor(code: CaptchaErrorCodeEnum, message: string, description: string = '', data: CaptchaErrorData | null = null) {
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

/**
 * Error codes for specific captcha error scenarios
 */
export enum CaptchaErrorCodeEnum {
    ERROR_SOLVING_CAPTCHA = 'error_solving_captcha',
}
