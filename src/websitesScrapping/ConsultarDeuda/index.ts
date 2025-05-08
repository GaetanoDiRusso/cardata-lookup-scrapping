import { solveCaptchaV2 } from '../../captcha/CapMonsterImp';
import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import puppeteer from 'puppeteer';
import { getDepartamentoValue } from './utils';
import { IWebsiteScrappingResult } from '../IWebsiteScrappingResult';
export type ConsultarDeudaData = Pick<VehiculePropertyRegisterData, 'matricula' | 'padron' | 'departamento'>;

const SUCIVE_MULTAS_URL = 'https://www.sucive.gub.uy/consulta_deuda?0';

export type ConsultarDeudaDataResult = {}

export const getConsultarDeudaData = async (vehicleData: ConsultarDeudaData): Promise<IWebsiteScrappingResult<ConsultarDeudaDataResult>> => {
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

        // Find and click all elements with class "label-accordion"
        await page.evaluate(() => {
            const accordionLabels = document.querySelectorAll('.label-accordion');
            console.log('accordionLabels', accordionLabels);
            accordionLabels.forEach(label => {
                (label as HTMLElement).click();
            });
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

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
            imagePaths: [Buffer.from(screenshotBuffer)],
            pdfPaths: [Buffer.from(pdfBuffer)],
            data: {},
        };
    } catch (error) {
        console.error('Error scraping SUCIVE deuda:', error);
        throw error;
    } finally {
        // Always close the browser
        await browser.close();
    }
}
