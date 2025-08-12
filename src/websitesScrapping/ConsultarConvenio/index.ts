import { solveCaptchaV2 } from '../../captcha/CapMonsterImp';
import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import type { Page } from 'puppeteer';
import { getDepartmentNumberFromCode } from '../utils';
import { BaseScrapingProcess } from '../BaseScrapingProcess';
import { Logger } from '../../domain/Logger';

export type ConsultarConvenioData = Pick<VehiculePropertyRegisterData, 'matricula' | 'padron' | 'departamento'>;

const SUCIVE_MULTAS_URL = 'https://www.sucive.gub.uy/consulta_convenio?2';

export type ConsultarConvenioDataResult = {
    hasConvenio: boolean;
}

class ConsultarConvenioProcess extends BaseScrapingProcess<ConsultarConvenioData, ConsultarConvenioDataResult> {
    protected async performScraping(page: Page, vehicleData: ConsultarConvenioData, logger: Logger): Promise<{
        imageBuffers: Buffer[];
        pdfBuffers: Buffer[];
        data: ConsultarConvenioDataResult;
    }> {
        logger.info('Navigating to the SUCIVE website', { SUCIVE_MULTAS_URL, vehicleData });

        // Navigate to the SUCIVE website
        await page.goto(SUCIVE_MULTAS_URL, {
            waitUntil: 'networkidle2'
        });

        logger.info('Filling the form with vehicle data', { vehicleData });

        // Fill the form with vehicle data
        await page.type('#matricula', vehicleData.matricula);
        await page.type('#padron', vehicleData.padron.toString());
        await page.select('#departamentoVehiculo', getDepartmentNumberFromCode(vehicleData.departamento));

        logger.info('Vehicle data filled successfully');

        // Check for presence of reCAPTCHA
        logger.info('Checking for presence of reCAPTCHA');
        // Wait for reCAPTCHA frame to be present
        await page.waitForFunction(() => {
            return document.querySelector('iframe[src*="recaptcha"]') !== null;
        }, { timeout: 5000 });

        logger.info('ReCAPTCHA frame found');

        // Then find the frame
        const captchaFrame = await page.frames().find(frame => frame.url().includes('recaptcha'));

        if (captchaFrame) {
            logger.info('Found reCAPTCHA frame');

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
                url: SUCIVE_MULTAS_URL
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

        // Take screenshot of the page with the data filled
        const screenshotBufferWithDataFilled = await page.screenshot({ fullPage: true });

        logger.info('Screenshot of the page with the data filled taken successfully');

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

        logger.info('PDF of the page with the data filled generated successfully');

        // Click the submit button - you'll need to find the actual selector for the submit button
        const submitButtonSelector = 'button[name="buttonPanel:buscarLink"]';
        await page.click(submitButtonSelector);

        logger.info('Submit button clicked successfully');

        logger.info('Waiting for navigation after form submission');

        // Wait for navigation after form submission
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        logger.info('Navigation after form submission completed successfully');

        // After form submission and waiting for navigation
        // Look for the "no infractions" label
        const noConvenioText = 'No hay resultados para la consulta';

        // Check if the "no infractions" label exists
        const hasNoConvenioLabel = await page.evaluate((text) => {
            const elements = Array.from(document.querySelectorAll('label, p, div, span'));
            return elements.some(el => el.textContent?.includes(text));
        }, noConvenioText);

        logger.info('No infractions label evaluated successfully', { hasNoConvenioLabel });

        // Take a screenshot of the results page
        const screenshotBuffer = await page.screenshot({ fullPage: true });

        logger.info('Screenshot of the results page taken successfully');

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

        logger.info('PDF of the results page generated successfully');

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

export const getConsultarConvenioData = async (vehicleData: ConsultarConvenioData, logger: Logger) => {
    return await consultarConvenioProcess.execute(vehicleData, logger);
};
