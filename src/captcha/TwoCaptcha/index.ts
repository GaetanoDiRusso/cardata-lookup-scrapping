import { CapMonsterCloudClientFactory, ClientOptions, RecaptchaV2ProxylessRequest } from '@zennolab_com/capmonstercloud-client';
import type { solveCaptchaV2Type } from '../index';
import { TWO_CAPTCHA_API_KEY } from '../../constants';
import { CaptchaError, CaptchaErrorCodeEnum } from '../CaptchaError';
import Client from '@infosimples/node_two_captcha';

let captchaClient: Client;

const getCaptchaClient = () => {
    if (!captchaClient) {
        captchaClient = new Client(TWO_CAPTCHA_API_KEY, {
            timeout: 180000,
            polling: 5000,
            throwErrors: false
        });
    }
    return captchaClient;
}

export const solveCaptchaV2: solveCaptchaV2Type = async (captchaData) => {
    try {
        const captchaClient = getCaptchaClient();
        
        const captchaResponse = await captchaClient.decodeRecaptchaV2({
            googlekey: captchaData.key,
            pageurl: captchaData.url
        });

        if (!captchaResponse.text) {
            throw new CaptchaError(CaptchaErrorCodeEnum.ERROR_SOLVING_CAPTCHA, 'Error solving captcha :: 2Captcha :: ' + captchaResponse.error);
        }
        
        return captchaResponse.text;
    } catch (error) {
        if (error instanceof CaptchaError) {
            throw error;
        }
        throw new CaptchaError(CaptchaErrorCodeEnum.ERROR_SOLVING_CAPTCHA, 'Error solving captcha :: 2Captcha :: ' + error);
    }
}
