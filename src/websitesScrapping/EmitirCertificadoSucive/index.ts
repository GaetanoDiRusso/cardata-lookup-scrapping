import { solveCaptchaV2 } from '../../captcha/CapMonsterImp';
import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import puppeteer from 'puppeteer';
import { getDepartamentoValue } from './utils';
import { IWebsiteScrappingResult } from '../IWebsiteScrappingResult';
import path from 'path';
import { writeFileSync } from 'fs';

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

        // Enable PDF download

        const cdpSession = await page.createCDPSession();
        cdpSession.send('Browser.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path.join(process.cwd(), 'puppeteer-downloads')
        });

        // let pdfUrl = null;
        // page.on('requestfinished', async (req) => {
        //     const url = req.url();
        //     const response = req.response();

        //     const contentType = req.response()?.headers()['content-type'] || '';

        //     // Create a safe filename from the URL
        //     const safeFilename = url
        //         .replace(/[^a-zA-Z0-9]/g, '_') // Replace invalid chars with underscore
        //         .replace(/_+/g, '_') // Replace multiple underscores with single
        //         .slice(0, 100); // Limit length

        //     try {
        //         const buffer = await response?.buffer();
        //         // Save the buffer to a file, use the url and timestamp to name the file
        //         writeFileSync(path.join(process.cwd(), `buffer-${safeFilename}-${Date.now()}.txt`), buffer as Buffer);
        //     } catch (error) {
        //         console.error('❌ Error downloading PDF:', error);
        //     }

        //     try {
        //         const text = await response?.text();
        //         // Save the text to a file, use the url and timestamp to name the file
        //         writeFileSync(path.join(process.cwd(), `text-${safeFilename}-${Date.now()}.txt`), text as string);
        //     } catch (error) {
        //         console.error('❌ Error downloading PDF:', error);
        //     }

        //     try {
        //         const content = await response?.content();
        //         // Save the buffer to a file, use the url and timestamp to name the file
        //         writeFileSync(path.join(process.cwd(), `content-${safeFilename}-${Date.now()}.txt`), content as Buffer);
        //     } catch (error) {
        //         console.error('❌ Error downloading PDF:', error);
        //     }

        //     if (contentType.includes('application/pdf')) {
        //         console.log('📄 Found a PDF response:', url);

        //         try {
        //             // Get the response text (base64 encoded data)
        //             const text = await req.response()?.text();

        //             // Extract base64 data from the response (remove the "data:application/pdf;base64," prefix)
        //             const base64Data = text.split(',')[1];

        //             // Decode the base64 data
        //             const pdfBuffer = Buffer.from(base64Data, 'base64');

        //             // Save the PDF file
        //             const filePath = path.join(process.cwd(), 'downloaded.pdf');
        //             writeFileSync(filePath, pdfBuffer);
        //             console.log('✅ PDF downloaded successfully:', filePath);
        //         } catch (error) {
        //             console.error('❌ Error downloading PDF:', error);
        //         }
        //     }
        // });

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

        const cdpSession2 = await page.createCDPSession();
        cdpSession2.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path.join(process.cwd(), 'puppeteer-downloads')
        });

        // // Enable PDF download
        // const client = await page.createCDPSession();
        // await client.send('Fetch.enable', {
        //   patterns: [
        //     {
        //       urlPattern: '*',
        //       requestStage: 'Response',
        //     },
        //   ],
        // });
        // await client.on('Fetch.requestPaused', async (reqEvent) => {
        //   const { requestId } = reqEvent;

        //   let responseHeaders = reqEvent.responseHeaders || [];
        //   let contentType = '';

        //   for (let elements of responseHeaders) {
        //     if (elements.name.toLowerCase() === 'content-type') {
        //       contentType = elements.value;
        //     }
        //   }

        //   if (contentType.endsWith('pdf') || contentType.endsWith('xml')) {

        //     responseHeaders.push({
        //       name: 'content-disposition',
        //       value: 'attachment',
        //     });

        //     const responseObj = await client.send('Fetch.getResponseBody', {
        //       requestId,
        //     });

        //     await client.send('Fetch.fulfillRequest', {
        //       requestId,
        //       responseCode: 200,
        //       responseHeaders,
        //       body: responseObj.body,
        //     });
        //   } else {
        //     await client.send('Fetch.continueRequest', { requestId });
        //   }
        // });

        await page.click(downloadButtonSelector);

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
