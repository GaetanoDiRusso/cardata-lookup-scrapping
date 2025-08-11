"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConsultarMatriculaRequeridaData = void 0;
const BaseScrapingProcess_1 = require("../BaseScrapingProcess");
const MATRICULAS_REQUERIDAS_URL = 'https://matriculas-requeridas.minterior.gub.uy/index.php';
class ConsultarMatriculaRequeridaProcess extends BaseScrapingProcess_1.BaseScrapingProcess {
    performScraping(page, vehicleData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Navigate to the Matriculas Requeridas website
            yield page.goto(MATRICULAS_REQUERIDAS_URL, {
                waitUntil: 'networkidle2'
            });
            // Fill the form with vehicle data
            yield page.type('#matricula', vehicleData.matricula);
            // Fill the captcha code input with the value from window.captchaCode
            yield page.evaluate(() => {
                const captchaInput = document.querySelector('#captcha_code');
                if (captchaInput && window.captchaCode) {
                    captchaInput.value = window.captchaCode;
                }
            });
            // Take screenshot of the page with the data filled
            const screenshotBufferWithDataFilled = yield page.screenshot({ fullPage: true });
            // Generate PDF of the page with the data filled
            const pdfBufferWithDataFilled = yield page.pdf({
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
            yield page.click(submitButtonSelector);
            // Wait for navigation after form submission
            yield page.waitForNavigation({ waitUntil: 'networkidle0' });
            // After form submission and waiting for navigation
            // Look for the "no infractions" label
            let alertResult = yield page.evaluate(() => {
                var _a;
                const alertElement = document.getElementById('alertMessage');
                if (!alertElement)
                    return null;
                return {
                    isRequired: alertElement.classList.contains('alert-danger'),
                    message: ((_a = alertElement.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || ''
                };
            });
            if (!alertResult) {
                alertResult = {
                    isRequired: null,
                    message: 'No se pudo obtener el resultado de la matrícula automáticamente. Por favor, verifique el PDF generado para obtener el resultado.'
                };
            }
            // Take a screenshot of the results page
            const screenshotBufferWithResult = yield page.screenshot({ fullPage: true });
            // Generate PDF of the results page
            const pdfBufferWithResult = yield page.pdf({
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
        });
    }
}
const consultarMatriculaRequeridaProcess = new ConsultarMatriculaRequeridaProcess();
const getConsultarMatriculaRequeridaData = (vehicleData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield consultarMatriculaRequeridaProcess.execute(vehicleData);
});
exports.getConsultarMatriculaRequeridaData = getConsultarMatriculaRequeridaData;
