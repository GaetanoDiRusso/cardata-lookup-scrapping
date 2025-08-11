import { solveCaptchaV2 } from '../../captcha/CapMonsterImp';
import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import type { Page } from 'puppeteer';
import { getDepartmentNumberFromCode } from '../utils';
import { BaseScrapingProcess } from '../BaseScrapingProcess';

export type ConsultarConvenioData = Pick<VehiculePropertyRegisterData, 'matricula' | 'padron' | 'departamento'>;

const SUCIVE_MULTAS_URL = 'https://www.sucive.gub.uy/consulta_convenio?2';

export type ConsultarConvenioDataResult = {
    hasConvenio: boolean;
}

class ConsultarConvenioProcess extends BaseScrapingProcess<ConsultarConvenioData, ConsultarConvenioDataResult> {
    protected async performScraping(page: Page, vehicleData: ConsultarConvenioData): Promise<{
        imageBuffers: Buffer[];
        pdfBuffers: Buffer[];
        data: ConsultarConvenioDataResult;
    }> {
        // Navigate to the SUCIVE website
        await page.goto(SUCIVE_MULTAS_URL, {
            waitUntil: 'networkidle2'
        });

        // Fill the form with vehicle data
        await page.type('#matricula', vehicleData.matricula);
        await page.type('#padron', vehicleData.padron.toString());
        await page.select('#departamentoVehiculo', getDepartmentNumberFromCode(vehicleData.departamento));

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
                url: SUCIVE_MULTAS_URL
            });

            // Inject the solution into the reCAPTCHA iframe
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
                }
            }, captchaSolutionString);
        }

        // Take screenshot of the page with the data filled
        const screenshotBufferWithDataFilled = await page.screenshot({ fullPage: true });

        // Generate PDF of the page with the data filled
        const pdfBufferWithDataFilled = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        // Click the submit button - you'll need to find the actual selector for the submit button
        const submitButtonSelector = 'button[name="buttonPanel:buscarLink"]';
        await page.click(submitButtonSelector);

        // Wait for navigation after form submission
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // After form submission and waiting for navigation
        // Look for the "no infractions" label
        const noConvenioText = 'No hay resultados para la consulta';

        // Check if the "no infractions" label exists
        const hasNoConvenioLabel = await page.evaluate((text) => {
            const elements = Array.from(document.querySelectorAll('label, p, div, span'));
            return elements.some(el => el.textContent?.includes(text));
        }, noConvenioText);

        // Take a screenshot of the results page
        const screenshotBuffer = await page.screenshot({ fullPage: true });

        // Generate PDF of the page
        const pdfBufferWithResult = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        });

        return {
            imageBuffers: [Buffer.from(screenshotBufferWithDataFilled), Buffer.from(screenshotBuffer)],
            pdfBuffers: [Buffer.from(pdfBufferWithDataFilled), Buffer.from(pdfBufferWithResult)],
            data: {
                hasConvenio: !hasNoConvenioLabel,
            },
        };
    }
}

const consultarConvenioProcess = new ConsultarConvenioProcess();

export const getConsultarConvenioData = async (vehicleData: ConsultarConvenioData) => {
    return await consultarConvenioProcess.execute(vehicleData);
};
