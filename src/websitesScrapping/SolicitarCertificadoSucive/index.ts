import { solveCaptchaV2 } from '../../captcha/CapMonsterImp';
import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import type { Page } from 'puppeteer';
import { getDepartmentNumberFromCode } from '../utils';
import { BaseScrapingProcess } from '../BaseScrapingProcess';

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
    protected async performScraping(page: Page, input: SolicitarCertificadoSuciveInput): Promise<{
        imageBuffers: Buffer[];
        pdfBuffers: Buffer[];
        data: SolicitarCertificadoSuciveDataResult;
    }> {
        const { vehicleData, requesterData } = input;

        // Sanitize requester identification data
        if (requesterData.identificationType === 'CI') {
            if (requesterData.identificationNumber.length !== 8) {
                throw new Error('Invalid CI number');
            }

            requesterData.identificationNumber = requesterData.identificationNumber.replace(/\./g, '');
            requesterData.identificationNumber = requesterData.identificationNumber.replace(/\-/g, '');
            requesterData.identificationNumber = requesterData.identificationNumber.slice(0, -1) + '-' + requesterData.identificationNumber.slice(-1);
        }

        // Navigate to the SUCIVE website
        await page.goto(SOLICITAR_CERTIFICADO_SUCIVE_URL, {
            waitUntil: 'networkidle2'
        });

        // Fill the form with vehicle data
        await page.type('#matricula', vehicleData.matricula);
        await page.type('#padron', vehicleData.padron.toString());
        await page.select('#departamento', getDepartmentNumberFromCode(vehicleData.departamento));

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

        // Check for presence of reCAPTCHA
        const captchaFrame = await page.frames().find(frame => frame.url().includes('recaptcha'));
        if (captchaFrame) {
            // Get the reCAPTCHA sitekey
            const captchaKey = await page.evaluate(() => {
                console.log('Getting captcha key');
                const element = document.querySelector<HTMLElement>('.g-recaptcha');
                return element?.getAttribute('data-sitekey') || null;
            });

            if (!captchaKey) {
                throw new Error('Could not find reCAPTCHA sitekey');
            }

            // Solve the captcha
            const captchaSolutionString = await solveCaptchaV2({
                key: captchaKey,
                url: SOLICITAR_CERTIFICADO_SUCIVE_URL
            });

            console.log('captchaSolutionString', captchaSolutionString);

            // Inject the solution into the reCAPTCHA iframe
            await page.evaluate((solution) => {
                console.log('solution', solution);

                // Try to find the input in different ways
                let input = document.querySelector('textarea[name="g-recaptcha-response"]');

                console.log('input', input);

                // Create a textarea with g-recaptcha-response if it doesn't exist
                if (!input) {
                    const textarea = document.createElement('textarea');
                    textarea.setAttribute('name', 'g-recaptcha-response');
                    textarea.style.display = 'none';
                    document.querySelector('form')?.appendChild(textarea);
                }

                if (input) {
                    (input as unknown as HTMLTextAreaElement).value = solution as string;
                }
            }, captchaSolutionString);
        }

        // Click the submit button
        const submitButtonSelector = 'button[name="buttonPanel:buscarLink"]';
        await page.click(submitButtonSelector);

        // Wait for navigation and check for error message
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        const errorMessage = await page.evaluate(() => {
            const errorElement = document.querySelector('.feedbackPanelERROR span');
            return errorElement ? errorElement.textContent : null;
        });

        if (errorMessage?.includes('Ya existe un trámite pendiente de pago')) {
            // TODO: Add a custom error
            throw new Error('Ya existe un trámite pendiente de pago para este vehículo');
        }

        // Let's fill the form with requester data
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

        // Check for presence of reCAPTCHA
        const captchaFrame2 = await page.frames().find(frame => frame.url().includes('recaptcha'));
        if (captchaFrame2) {
            // Get the reCAPTCHA sitekey
            const captchaKey = await page.evaluate(() => {
                console.log('Getting captcha key');
                const element = document.querySelector<HTMLElement>('.g-recaptcha');
                return element?.getAttribute('data-sitekey') || null;
            });

            if (!captchaKey) {
                throw new Error('Could not find reCAPTCHA sitekey');
            }

            // Solve the captcha
            const captchaSolutionString = await solveCaptchaV2({
                key: captchaKey,
                url: SOLICITAR_CERTIFICADO_SUCIVE_URL
            });

            console.log('captchaSolutionString', captchaSolutionString);

            // Inject the solution into the reCAPTCHA iframe
            await page.evaluate((solution) => {
                console.log('solution', solution);

                // Try to find the input in different ways
                let input = document.querySelector('textarea[name="g-recaptcha-response"]');

                console.log('input', input);

                // Create a textarea with g-recaptcha-response if it doesn't exist
                if (!input) {
                    const textarea = document.createElement('textarea');
                    textarea.setAttribute('name', 'g-recaptcha-response');
                    textarea.style.display = 'none';
                    document.querySelector('form')?.appendChild(textarea);
                }

                if (input) {
                    (input as unknown as HTMLTextAreaElement).value = solution as string;
                }
            }, captchaSolutionString);
        }

        // Click the submit button - you'll need to find the actual selector for the submit button
        const submitButtonSelector2 = 'button[name="buttonPanel:buscarLink"]';
        await page.click(submitButtonSelector2);

        // Wait for navigation after form submission
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

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

        // Get the transaction number
        const transactionNumber = await page.evaluate(() => {
            const element = document.querySelector('#numeroTramite');
            return element ? element.textContent : null;
        });

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

export const solicitarCertificadoSucive = async (vehicleData: ConsultarDeudaData, requesterData: RequesterData) => {
    return await solicitarCertificadoSuciveProcess.execute({ vehicleData, requesterData }, false);
};
