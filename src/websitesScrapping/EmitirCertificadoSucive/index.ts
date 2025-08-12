import { solveCaptchaV2 } from '../../captcha/CapMonsterImp';
import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import type { Page } from 'puppeteer';
import puppeteer from 'puppeteer-core';
import { getDepartmentNumberFromCode } from '../utils';
import path from 'path';
import { readFileSync, unlinkSync, rmdirSync } from 'fs';
import { BaseScrapingProcess } from '../BaseScrapingProcess';

import { PuppeteerExtra } from 'puppeteer-extra';
import userPreferencesPlugin from 'puppeteer-extra-plugin-user-preferences';
import { Logger } from '../../domain/Logger';
import chromium from "@sparticuz/chromium";

export type EmitirCertificadoSuciveData = Pick<VehiculePropertyRegisterData, 'matricula' | 'padron' | 'departamento'>;

const EMITIR_CERTIFICADO_SUCIVE_URL = 'https://www.sucive.gub.uy/consulta_certificado_sucive?3';

export type EmitirCertificadoSuciveDataResult = {}

export type EmitirCertificadoSuciveInput = {
    vehicleData: EmitirCertificadoSuciveData;
    requestNumber: string;
}

class EmitirCertificadoSuciveProcess extends BaseScrapingProcess<EmitirCertificadoSuciveInput, EmitirCertificadoSuciveDataResult> {
    // @ts-ignore
    protected async launchBrowser() {
        const puppeteerExtra = new PuppeteerExtra(puppeteer as any);
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

        const executablePath = await chromium.executablePath();

        return await puppeteerExtra.launch({
            // @ts-ignore
            headless: chromium.headless,
            args: chromium.args,
            executablePath,
            defaultViewport: { width: 1280, height: 800 },
            env: { ...process.env, TZ: "America/Montevideo" },
            downloadBehavior: {
                policy: 'allow',
                downloadPath: path.join(process.cwd(), 'puppeteer-downloads')
            }
        });
    }

    protected async performScraping(page: Page, input: EmitirCertificadoSuciveInput, logger: Logger): Promise<{
        imageBuffers: Buffer[];
        pdfBuffers: Buffer[];
        data: EmitirCertificadoSuciveDataResult;
    }> {
        const { vehicleData, requestNumber } = input;

        logger.info('Navigating to the SUCIVE website', { EMITIR_CERTIFICADO_SUCIVE_URL, vehicleData, requestNumber });

        // Navigate to the SUCIVE website
        await page.goto(EMITIR_CERTIFICADO_SUCIVE_URL, {
            waitUntil: 'networkidle2'
        });

        logger.info('Filling the form with vehicle data', { vehicleData, requestNumber });

        // Fill the form with vehicle data
        await page.type('#matricula', vehicleData.matricula);
        await page.type('#padron', vehicleData.padron.toString());
        await page.select('#departamento', getDepartmentNumberFromCode(vehicleData.departamento));
        await page.type('#nroTramite', requestNumber);

        logger.info('Vehicle data filled successfully');

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
                url: EMITIR_CERTIFICADO_SUCIVE_URL
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

        // Click the submit button - you'll need to find the actual selector for the submit button
        const submitButtonSelector = 'button[name="buttonPanel:buscarLink"]';
        await page.click(submitButtonSelector);

        logger.info('Submit button clicked successfully');

        logger.info('Waiting for navigation after form submission');

        // Wait for navigation after form submission
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 120000 });

        logger.info('Navigation after form submission completed successfully');

        // Wait for and click the download button
        const downloadButtonSelector = 'a.button[title="Descargar certificado"]';
        await page.waitForSelector(downloadButtonSelector);

        logger.info('Download button found successfully');

        // Set a temporary unique download path
        const downloadPathFolder = path.join('/tmp', `certificado-${Date.now()}-${vehicleData.matricula}-${requestNumber}`);

        logger.info('Creating temporary download path folder for the "Certificado SUCIVE"', { downloadPathFolder });

        // Ensure the directory exists
        try {
            const { mkdirSync } = require('fs');
            mkdirSync(downloadPathFolder, { recursive: true });
            logger.info('Download directory created successfully');
        } catch (error) {
            logger.error('Error creating download directory', { error: (error as Error).message });
            throw new Error(`Failed to create download directory: ${(error as Error).message}`);
        }

        const cdpSession2 = await page.createCDPSession();
        cdpSession2.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadPathFolder
        });

        const downloadPath = path.join(downloadPathFolder, 'page.pdf');

        logger.info('Download path created successfully', { downloadPath });

        await page.click(downloadButtonSelector);

        logger.info('Download button clicked successfully');

        // Try to read the PDF, wait one second before trying.
        // Repeat until the file is found. Max 5 attempts.
        let pdfBuffer: Buffer | null = null;
        for (let i = 0; i < 5; i++) {
            try {
                logger.info(`Waiting one second before trying to read the PDF - Attempt ${i + 1}`);

                // Wait one second before trying
                await new Promise(resolve => setTimeout(resolve, 1000));

                logger.info(`Reading the PDF - Attempt ${i + 1}`);

                // Save the PDF to a buffer
                pdfBuffer = readFileSync(downloadPath);

                logger.info(`PDF read successfully - Attempt ${i + 1}`);

                break;
            } catch (error) {
                logger.error(`Error getting "emitir certificado" PDF - Attempt ${i + 1}`, { error });
            }
        }

        if (!pdfBuffer) {
            logger.error('Could not get "emitir certificado" PDF');
            throw new Error('Could not get "emitir certificado" PDF');
        }

        logger.info('PDF read successfully', { pdfBufferLength: pdfBuffer.length });

        logger.info('Deleting the file');
        // Delete the file
        unlinkSync(downloadPath);

        // Delete the folder
        logger.info('File deleted successfully');

        logger.info('Deleting the folder');

        rmdirSync(downloadPathFolder);

        logger.info('Folder deleted successfully');

        return {
            imageBuffers: [],
            pdfBuffers: [pdfBuffer],
            data: {},
        };
    }
}

const emitirCertificadoSuciveProcess = new EmitirCertificadoSuciveProcess();

export const emitirCertificadoSuciveData = async (vehicleData: EmitirCertificadoSuciveData, requestNumber: string, logger: Logger) => {
    return await emitirCertificadoSuciveProcess.execute({ vehicleData, requestNumber }, logger);
};
