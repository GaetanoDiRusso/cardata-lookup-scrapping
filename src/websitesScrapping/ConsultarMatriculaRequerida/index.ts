import type { VehiculePropertyRegisterData } from '../../domain/VehiculeData';
import type { Page } from 'puppeteer';
import { BaseScrapingProcess } from '../BaseScrapingProcess';

export type ConsultarMatriculaRequeridaData = Pick<VehiculePropertyRegisterData, 'matricula'>;

const MATRICULAS_REQUERIDAS_URL = 'https://matriculas-requeridas.minterior.gub.uy/index.php';

export type ConsultarMatriculaRequeridaDataResult = {
    isRequired: boolean | null;
    message: string;
}

class ConsultarMatriculaRequeridaProcess extends BaseScrapingProcess<ConsultarMatriculaRequeridaData, ConsultarMatriculaRequeridaDataResult> {
    protected async performScraping(page: Page, vehicleData: ConsultarMatriculaRequeridaData): Promise<{
        imageBuffers: Buffer[];
        pdfBuffers: Buffer[];
        data: ConsultarMatriculaRequeridaDataResult;
    }> {
        // Navigate to the Matriculas Requeridas website
        await page.goto(MATRICULAS_REQUERIDAS_URL, {
            waitUntil: 'networkidle2'
        });

        // Fill the form with vehicle data
        await page.type('#matricula', vehicleData.matricula);

        // Fill the captcha code input with the value from window.captchaCode
        await page.evaluate(() => {
            const captchaInput = document.querySelector<HTMLInputElement>('#captcha_code');
            if (captchaInput && (window as any).captchaCode) {
                captchaInput.value = (window as any).captchaCode;
            }
        });

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
        const submitButtonSelector = 'button.btngubuy[type="submit"]';
        await page.click(submitButtonSelector);

        // Wait for navigation after form submission
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

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

        if (!alertResult) {
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

        return {
            imageBuffers: [Buffer.from(screenshotBufferWithDataFilled), Buffer.from(screenshotBufferWithResult)],
            pdfBuffers: [Buffer.from(pdfBufferWithDataFilled), Buffer.from(pdfBufferWithResult)],
            data: alertResult,
        };
    }
}

const consultarMatriculaRequeridaProcess = new ConsultarMatriculaRequeridaProcess();

export const getConsultarMatriculaRequeridaData = async (vehicleData: ConsultarMatriculaRequeridaData) => {
    return await consultarMatriculaRequeridaProcess.execute(vehicleData);
};
