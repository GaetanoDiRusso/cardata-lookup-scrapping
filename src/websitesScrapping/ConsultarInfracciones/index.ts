import { solveCaptchaV2 } from '../../captcha/CapMonsterImp';
import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import puppeteer from 'puppeteer';
import { getDepartamentoValue } from './utils';
import { IWebsiteScrappingResult } from '../IWebsiteScrappingResult';
export type ConsultarInfraccionesData = Pick<VehiculePropertyRegisterData, 'matricula' | 'padron' | 'departamento'>;

const SUCIVE_MULTAS_URL = 'https://www.sucive.gub.uy/consulta_multas?1';

export type ConsultarInfraccionesDataResult = {
    hasInfractions: boolean;
}

export const getConsultarInfraccionesData = async (vehicleData: ConsultarInfraccionesData): Promise<IWebsiteScrappingResult<ConsultarInfraccionesDataResult>> => {
    // Launch a headless browser
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        // Create a new page
        const page = await browser.newPage();

        // Set viewport size
        await page.setViewport({ width: 1280, height: 800 });

        // Navigate to the SUCIVE website
        await page.goto(SUCIVE_MULTAS_URL, {
            waitUntil: 'networkidle2'
        });

        // Fill the form with vehicle data
        await page.type('#matricula', vehicleData.matricula);
        await page.type('#padron', vehicleData.padron.toString());
        await page.select('#departamento', getDepartamentoValue(vehicleData.departamento));

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

            const html = await page.content();
            await require('fs').promises.writeFile('page.html', html);

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
        const submitButtonSelector = 'button[name="buttonPanel:buscarLink"]';
        await page.click(submitButtonSelector);

        // Wait for navigation after form submission
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // After form submission and waiting for navigation
        // Look for the "no infractions" label
        const noInfractionsText = 'Este vehículo NO tiene infracciones pendientes de pago.';

        // Check if the "no infractions" label exists
        const hasNoInfractionsLabel = await page.evaluate((text) => {
            const elements = Array.from(document.querySelectorAll('label, p, div, span'));
            return elements.some(el => el.textContent?.includes(text));
        }, noInfractionsText);

        // Take a screenshot of the results page
        const screenshotBuffer = await page.screenshot({ fullPage: true });

        // Generate PDF of the page
        const pdfBuffer = await page.pdf({
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
            imageBuffers: [Buffer.from(screenshotBuffer)],
            pdfBuffers: [Buffer.from(pdfBuffer)],
            data: {
                hasInfractions: !hasNoInfractionsLabel,
            },
        };
    } catch (error) {
        console.error('Error scraping SUCIVE infractions:', error);
        throw error;
    } finally {
        // Always close the browser
        await browser.close();
    }
}
