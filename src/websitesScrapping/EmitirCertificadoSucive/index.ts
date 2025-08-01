import { solveCaptchaV2 } from '../../captcha/CapMonsterImp';
import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import puppeteer from 'puppeteer';
import { getDepartamentoValue } from './utils';
import { IWebsiteScrappingResult } from '../IWebsiteScrappingResult';
import path from 'path';
import { readFileSync, unlinkSync, rmdirSync } from 'fs';

import { PuppeteerExtra } from 'puppeteer-extra';
import userPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';

export type EmitirCertificadoSuciveData = Pick<VehiculePropertyRegisterData, 'matricula' | 'padron' | 'departamento'>;

const EMITIR_CERTIFICADO_SUCIVE_URL = 'https://www.sucive.gub.uy/consulta_certificado_sucive?3';

export type EmitirCertificadoSuciveDataResult = {}

export const emitirCertificadoSuciveData = async (vehicleData: EmitirCertificadoSuciveData, requestNumber: string): Promise<IWebsiteScrappingResult<EmitirCertificadoSuciveDataResult>> => {
    // Launch a headless browser

    const puppeteerExtra = new PuppeteerExtra(puppeteer);
    puppeteerExtra.use(userPreferencesPlugin({
        userPrefs: {
            download: {
                prompt_for_download: false,
                open_pdf_in_system_reader: true,
            },
            plugins: {
                always_open_pdf_externally: true,
            }
        }
    }));

    const browser = await puppeteerExtra.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        downloadBehavior: {
            policy: 'allow',
            downloadPath: path.join(process.cwd(), 'puppeteer-downloads')
        }
    });

    try {
        // Create a new page
        const page = await browser.newPage();

        // Set viewport size
        await page.setViewport({ width: 1280, height: 800 });

        // Navigate to the SUCIVE website
        await page.goto(EMITIR_CERTIFICADO_SUCIVE_URL, {
            waitUntil: 'networkidle2'
        });

        // // Set a temporary unique download path
        // const downloadPath = path.join(process.cwd(), 'puppeteer-downloads', `certificado-${Date.now()}-${vehicleData.matricula}-${requestNumber}.pdf`);

        // // // Enable PDF download
        // // const cdpSession = await page.createCDPSession();
        // // cdpSession.send('Browser.setDownloadBehavior', {
        // //     behavior: 'allow',
        // //     downloadPath: downloadPath
        // // });

        // Fill the form with vehicle data
        await page.type('#matricula', vehicleData.matricula);
        await page.type('#padron', vehicleData.padron.toString());
        await page.select('#departamento', getDepartamentoValue(vehicleData.departamento));
        await page.type('#nroTramite', requestNumber);

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
                url: EMITIR_CERTIFICADO_SUCIVE_URL
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
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 120000 });

        // Wait for and click the download button
        const downloadButtonSelector = 'a.button[title="Descargar certificado"]';
        await page.waitForSelector(downloadButtonSelector);

        // Set a temporary unique download path
        const downloadPathFolder = path.join(process.cwd(), 'puppeteer-downloads', `certificado-${Date.now()}-${vehicleData.matricula}-${requestNumber}`);

        const cdpSession2 = await page.createCDPSession();
        cdpSession2.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPathFolder
        });

        const downloadPath = path.join(downloadPathFolder, 'page.pdf');

        await page.click(downloadButtonSelector);

        // Try to read the PDF, wait one second before trying.
        // Repeat until the file is found. Max 5 attempts.
        let pdfBuffer: Buffer | null = null;
        for (let i = 0; i < 5; i++) {
            try {
                // Wait one second before trying
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Save the PDF to a buffer
                pdfBuffer = readFileSync(downloadPath);
                break;
            } catch (error) {
                console.error(`Error getting "emitir certificado" PDF for ${vehicleData.matricula} ${vehicleData.padron} ${requestNumber} - Attempt ${i + 1} - Time: ${new Date().toISOString()}:`, error);
            }
        }

        if (!pdfBuffer) {
            throw new Error('Could not get "emitir certificado" PDF');
        }

        // Delete the file
        unlinkSync(downloadPath);

        // Delete the folder
        rmdirSync(downloadPathFolder);

        return {
            imagePaths: [],
            pdfPaths: [pdfBuffer],
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
