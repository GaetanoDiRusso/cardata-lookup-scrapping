import { CapMonsterCloudClientFactory, ClientOptions, RecaptchaV2ProxylessRequest } from '@zennolab_com/capmonstercloud-client';
import type { solveCaptchaV2Type } from '../index';
import { CAPMONSTER_API_KEY } from '../../constants';
import { CaptchaError, CaptchaErrorCodeEnum } from '../CaptchaError';

export const solveCaptchaV2: solveCaptchaV2Type = async (captchaData) => {
    try {
        const cmcClient = CapMonsterCloudClientFactory.Create(new ClientOptions({ clientKey: CAPMONSTER_API_KEY }));
        
        const recaptchaV2ProxylessRequest = new RecaptchaV2ProxylessRequest({
          websiteURL: captchaData.url,
          websiteKey: captchaData.key,
        });
        
        const res = await cmcClient.Solve(recaptchaV2ProxylessRequest);

        if (!res.solution?.gRecaptchaResponse) {
            throw new CaptchaError(CaptchaErrorCodeEnum.ERROR_SOLVING_CAPTCHA, 'Error solving captcha :: CapMonster :: ' + res.error);
        }

        return res.solution?.gRecaptchaResponse;
    } catch (error) {
        if (error instanceof CaptchaError) {
            throw error;
        }
        throw new CaptchaError(CaptchaErrorCodeEnum.ERROR_SOLVING_CAPTCHA, 'Error solving captcha :: CapMonster :: ' + error);
    }
}
