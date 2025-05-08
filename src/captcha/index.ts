import { CaptchaError } from "./CaptchaError";

export type solveCaptchaV2Type = (captchaData: { key: string, url: string }) => Promise<CaptchaError | string>;