import { solveCaptchaV2 } from '../../captcha/CapMonsterImp';
import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import type { Page } from 'puppeteer';
import { getDepartmentNumberFromCode } from '../utils';
import { BaseScrapingProcess } from '../BaseScrapingProcess';
import { Logger } from '../../domain/Logger';

export type ConsultarDeudaData = Pick<VehiculePropertyRegisterData, 'matricula' | 'padron' | 'departamento'>;

const SOLICITAR_CERTIFICADO_SUCIVE_URL = 'https://www.sucive.gub.uy/solicitud_certificado_sucive?3';

export type RequesterData = {
    fullName: string;
    identificationType: 'CI' | 'RUT';
    identificationNumber: string;
    email: string;
    phoneNumber?: string;
    address?: string;
}

export type SolicitarCertificadoSuciveDataResult = {
    transactionNumber?: string;
    error?: string;
}

export type SolicitarCertificadoSuciveInput = {
    vehicleData: ConsultarDeudaData;
    requesterData: RequesterData;
}

class SolicitarCertificadoSuciveProcess extends BaseScrapingProcess<SolicitarCertificadoSuciveInput, SolicitarCertificadoSuciveDataResult> {
    protected async performScraping(page: Page, input: SolicitarCertificadoSuciveInput, logger: Logger): Promise<{
        imageBuffers: Buffer[];
        pdfBuffers: Buffer[];
        data: SolicitarCertificadoSuciveDataResult;
    }> {
        const { vehicleData, requesterData } = input;

        logger.info('Sanitizing requester identification data', { requesterData });

        // Sanitize requester identification data
        if (requesterData.identificationType === 'CI') {
            if (requesterData.identificationNumber.length !== 8) {
                throw new Error('Invalid CI number');
            }

            requesterData.identificationNumber = requesterData.identificationNumber.replace(/\./g, '');
            requesterData.identificationNumber = requesterData.identificationNumber.replace(/\-/g, '');
            requesterData.identificationNumber = requesterData.identificationNumber.slice(0, -1) + '-' + requesterData.identificationNumber.slice(-1);
        }

        logger.info('Navigating to the SUCIVE website', { SOLICITAR_CERTIFICADO_SUCIVE_URL, input });

        // Navigate to the SUCIVE website
        await page.goto(SOLICITAR_CERTIFICADO_SUCIVE_URL, {
            waitUntil: 'networkidle2'
        });

        logger.info('Filling the form with vehicle data', { vehicleData });

        // Fill the form with vehicle data
        await page.type('#matricula', vehicleData.matricula);
        await page.type('#padron', vehicleData.padron.toString());
        await page.select('#departamento', getDepartmentNumberFromCode(vehicleData.departamento));

        logger.info('Vehicle data filled successfully');

        // Take a screenshot with the initial data filled
        const initialDataScreenshotBuffer = await page.screenshot({ fullPage: true });

        // Generate PDF of the page
        const initialDataPdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        logger.info('Initial data PDF generated successfully');

        // Check for presence of reCAPTCHA
        logger.info('Checking for presence of reCAPTCHA');
        // Wait for reCAPTCHA frame to be present
        await page.waitForFunction(() => {
            return document.querySelector('iframe[src*="recaptcha"]') !== null;
        }, { timeout: 5000 });

        logger.info('ReCAPTCHA frame found');

        const captchaFrame = await page.frames().find(frame => frame.url().includes('recaptcha'));
        if (captchaFrame) {
            // Get the reCAPTCHA sitekey
            logger.info('Getting captcha key from the reCAPTCHA frame');
            const captchaKey = await page.evaluate(() => {
                const element = document.querySelector<HTMLElement>('.g-recaptcha');
                return element?.getAttribute('data-sitekey') || null;
            });

            logger.info('Captcha key got successfully', { captchaKey });

            if (!captchaKey) {
                logger.error('Could not find reCAPTCHA sitekey');
                throw new Error('Could not find reCAPTCHA sitekey');
            }

            logger.info('Solving captcha', { captchaKey });

            // Solve the captcha
            const captchaSolutionString = await solveCaptchaV2({
                key: captchaKey,
                url: SOLICITAR_CERTIFICADO_SUCIVE_URL
            });

            logger.info('Captcha solved successfully', { captchaSolutionString });

            // Inject the solution into the reCAPTCHA iframe
            logger.info('Searching for textarea to inject captcha solution in the reCAPTCHA iframe');
            await page.evaluate((solution) => {
                // Try to find the input in different ways
                let input = document.querySelector('textarea[name="g-recaptcha-response"]');

                // Create a textarea with g-recaptcha-response if it doesn't exist
                if (!input) {
                    const textarea = document.createElement('textarea');
                    textarea.setAttribute('name', 'g-recaptcha-response');
                    textarea.style.display = 'none';
                    document.querySelector('form')?.appendChild(textarea);
                }

                if (input) {
                    (input as unknown as HTMLTextAreaElement).value = solution as string;
                } else {
                    throw new Error('Could not find textarea to inject captcha solution');
                }
            }, captchaSolutionString);
        } else {
            logger.error('Could not find reCAPTCHA frame');
            throw new Error('Could not find reCAPTCHA frame');
        }

        logger.info('Captcha solution injected into the reCAPTCHA iframe successfully');

        // Click the submit button
        const submitButtonSelector = 'button[name="buttonPanel:buscarLink"]';
        await page.click(submitButtonSelector);

        logger.info('Submit button clicked successfully');

        logger.info('Waiting for navigation after form submission');

        // Wait for navigation and check for error message
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        logger.info('Navigation after form submission completed successfully');

        logger.info('Evaluating error message');

        const errorMessage = await page.evaluate(() => {
            const errorElement = document.querySelector('.feedbackPanelERROR span');
            return errorElement ? errorElement.textContent : null;
        });

        logger.info('Error message evaluated successfully', { errorMessage });

        if (errorMessage?.includes('Ya existe un trámite pendiente de pago')) {
            logger.error('Ya existe un trámite pendiente de pago para este vehículo');
            throw new Error('Ya existe un trámite pendiente de pago para este vehículo');
        }

        // Let's fill the form with requester data
        logger.info('Filling the form with requester data', { requesterData });

        await page.type('#nombreSolicitante', requesterData.fullName);

        const identificationTypeMap = {
            CI: "0",
            RUT: "1",
        }
        await page.select('#tipoDoc', identificationTypeMap[requesterData.identificationType].toString());

        await page.type('#nroDoc', requesterData.identificationNumber);

        await page.type('#correo', requesterData.email);
        await page.type('#correoConfirm', requesterData.email);
        await page.type('#telefono', requesterData.phoneNumber || '');
        await page.type('#domicilio', requesterData.address || '');

        logger.info('Requester data filled successfully');

        // Take a screenshot with the form filled
        const formFilledScreenshotBuffer = await page.screenshot({ fullPage: true });

        // Generate PDF of the page
        const formFilledPdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        logger.info('Form filled PDF generated successfully');

        // Check for presence of reCAPTCHA
        logger.info('Checking for presence of reCAPTCHA for the second captcha');
        // Wait for reCAPTCHA frame to be present
        await page.waitForFunction(() => {
            return document.querySelector('iframe[src*="recaptcha"]') !== null;
        }, { timeout: 5000 });

        logger.info('ReCAPTCHA frame found for the second captcha');

        const captchaFrame2 = await page.frames().find(frame => frame.url().includes('recaptcha'));
        if (captchaFrame2) {
            // Get the reCAPTCHA sitekey
            logger.info('Getting captcha key from the reCAPTCHA frame for the second captcha');
            const captchaKey = await page.evaluate(() => {
                const element = document.querySelector<HTMLElement>('.g-recaptcha');
                return element?.getAttribute('data-sitekey') || null;
            });

            logger.info('Captcha key got successfully for the second captcha', { captchaKey });

            if (!captchaKey) {
                logger.error('Could not find reCAPTCHA sitekey for the second captcha');
                throw new Error('Could not find reCAPTCHA sitekey for the second captcha');
            }

            logger.info('Solving captcha for the second captcha', { captchaKey });

            // Solve the captcha
            const captchaSolutionString = await solveCaptchaV2({
                key: captchaKey,
                url: SOLICITAR_CERTIFICADO_SUCIVE_URL
            });

            logger.info('Captcha solved successfully for the second captcha', { captchaSolutionString });

            // Inject the solution into the reCAPTCHA iframe
            logger.info('Searching for textarea to inject captcha solution in the reCAPTCHA iframe for the second captcha');
            await page.evaluate((solution) => {
                // Try to find the input in different ways
                let input = document.querySelector('textarea[name="g-recaptcha-response"]');

                // Create a textarea with g-recaptcha-response if it doesn't exist
                if (!input) {
                    const textarea = document.createElement('textarea');
                    textarea.setAttribute('name', 'g-recaptcha-response');
                    textarea.style.display = 'none';
                    document.querySelector('form')?.appendChild(textarea);
                }

                if (input) {
                    (input as unknown as HTMLTextAreaElement).value = solution as string;
                } else {
                    throw new Error('Could not find textarea to inject captcha solution for the second captcha');
                }
            }, captchaSolutionString);
        } else {
            logger.error('Could not find reCAPTCHA frame for the second captcha');
            throw new Error('Could not find reCAPTCHA frame for the second captcha');
        }

        logger.info('Captcha solution injected into the reCAPTCHA iframe successfully for the second captcha');

        // Click the submit button - you'll need to find the actual selector for the submit button
        const submitButtonSelector2 = 'button[name="buttonPanel:buscarLink"]';
        await page.click(submitButtonSelector2);

        logger.info('Submit button clicked successfully for the second step');

        logger.info('Waiting for navigation after form submission for the second step');

        // Wait for navigation after form submission
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        logger.info('Navigation after form submission for the second step completed successfully');

        // Take a screenshot with the form filled
        const formFilledScreenshotBuffer2 = await page.screenshot({ fullPage: true });

        // Generate PDF of the page
        const formFilledPdfBuffer2 = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        logger.info('Form filled PDF generated successfully for the second step');

        // Get the transaction number
        const transactionNumber = await page.evaluate(() => {
            const element = document.querySelector('#numeroTramite');
            return element ? element.textContent : null;
        });

        logger.info('Transaction number got successfully', { transactionNumber });

        return {
            imageBuffers: [Buffer.from(initialDataScreenshotBuffer), Buffer.from(formFilledScreenshotBuffer), Buffer.from(formFilledScreenshotBuffer2)],
            pdfBuffers: [Buffer.from(initialDataPdfBuffer), Buffer.from(formFilledPdfBuffer), Buffer.from(formFilledPdfBuffer2)],
            data: {
                transactionNumber: transactionNumber || undefined
            },
        };
    }
}

const solicitarCertificadoSuciveProcess = new SolicitarCertificadoSuciveProcess();

export const solicitarCertificadoSucive = async (vehicleData: ConsultarDeudaData, requesterData: RequesterData, logger: Logger) => {
    return await solicitarCertificadoSuciveProcess.execute({ vehicleData, requesterData }, logger);
};
