import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import type { Page } from 'puppeteer';
import { BaseScrapingProcess } from '../BaseScrapingProcess';
import { Logger } from '../../domain/Logger';

export type ConsultarMatriculaRequeridaData = Pick<VehiculePropertyRegisterData, 'matricula'>;

const MATRICULAS_REQUERIDAS_URL = 'https://matriculas-requeridas.minterior.gub.uy/index.php';

export type ConsultarMatriculaRequeridaDataResult = {
    isRequired: boolean | null;
    message: string;
}

class ConsultarMatriculaRequeridaProcess extends BaseScrapingProcess<ConsultarMatriculaRequeridaData, ConsultarMatriculaRequeridaDataResult> {
    protected async performScraping(page: Page, vehicleData: ConsultarMatriculaRequeridaData, logger: Logger): Promise<{
        imageBuffers: Buffer[];
        pdfBuffers: Buffer[];
        data: ConsultarMatriculaRequeridaDataResult;
    }> {

        logger.info('Navigating to the Matriculas Requeridas website', { MATRICULAS_REQUERIDAS_URL, vehicleData });
        
        // Navigate to the Matriculas Requeridas website
        await page.goto(MATRICULAS_REQUERIDAS_URL, {
            waitUntil: 'networkidle2'
        });

        logger.info('Filling the form with vehicle data', { vehicleData });

        // Fill the form with vehicle data
        await page.type('#matricula', vehicleData.matricula);

        logger.info('Matricula field filled successfully');

        // Fill the captcha code input with the value from window.captchaCode
        await page.evaluate(() => {
            const captchaInput = document.querySelector<HTMLInputElement>('#captcha_code');
            if (captchaInput && (window as any).captchaCode) {
                captchaInput.value = (window as any).captchaCode;
            }
        });

        logger.info('Captcha code field filled successfully');

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

        // Click the submit button
        const submitButtonSelector = 'button.btngubuy[type="submit"]';
        await page.click(submitButtonSelector);

        logger.info('Submit button clicked successfully');

        // Instead of waiting for navigation, wait for the result to appear
        logger.info('Waiting for form submission result');

        try {
            // Wait for the alert message to appear
            await page.waitForSelector('#alertMessage', { timeout: 30000 });
            logger.info('Form submission completed, result element found');
        } catch (error) {
            logger.info('Timeout waiting for result, but continuing...');
        }

        logger.info('Navigation after form submission completed successfully');

        // After form submission and waiting for navigation
        // Look for the "no infractions" label
        let alertResult: ConsultarMatriculaRequeridaDataResult | null = await page.evaluate(() => {
            const alertElement = document.getElementById('alertMessage');
            if (!alertElement) return null;

            return {
                isRequired: alertElement.classList.contains('alert-danger'),
                message: alertElement.textContent?.trim() || ''
            };
        });

        logger.info('Alert result evaluated successfully', { alertResult });

        if (!alertResult) {
            logger.info('Alert result not found, setting default value');
            alertResult = {
                isRequired: null,
                message: 'No se pudo obtener el resultado de la matrícula automáticamente. Por favor, verifique el PDF generado para obtener el resultado.'
            };
        }

        // Take a screenshot of the results page
        const screenshotBufferWithResult = await page.screenshot({ fullPage: true });

        // Generate PDF of the results page
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
            imageBuffers: [Buffer.from(screenshotBufferWithDataFilled), Buffer.from(screenshotBufferWithResult)],
            pdfBuffers: [Buffer.from(pdfBufferWithDataFilled), Buffer.from(pdfBufferWithResult)],
            data: alertResult,
        };
    }
}

const consultarMatriculaRequeridaProcess = new ConsultarMatriculaRequeridaProcess();

export const getConsultarMatriculaRequeridaData = async (vehicleData: ConsultarMatriculaRequeridaData, logger: Logger) => {
    return await consultarMatriculaRequeridaProcess.execute(vehicleData, logger);
};
