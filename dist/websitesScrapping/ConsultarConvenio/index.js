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
exports.getConsultarConvenioData = void 0;
const CapMonsterImp_1 = require("../../captcha/CapMonsterImp");
const utils_1 = require("../utils");
const BaseScrapingProcess_1 = require("../BaseScrapingProcess");
const SUCIVE_MULTAS_URL = 'https://www.sucive.gub.uy/consulta_convenio?2';
class ConsultarConvenioProcess extends BaseScrapingProcess_1.BaseScrapingProcess {
    performScraping(page, vehicleData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Navigate to the SUCIVE website
            yield page.goto(SUCIVE_MULTAS_URL, {
                waitUntil: 'networkidle2'
            });
            // Fill the form with vehicle data
            yield page.type('#matricula', vehicleData.matricula);
            yield page.type('#padron', vehicleData.padron.toString());
            yield page.select('#departamentoVehiculo', (0, utils_1.getDepartmentNumberFromCode)(vehicleData.departamento));
            // Check for presence of reCAPTCHA
            const captchaFrame = yield page.frames().find(frame => frame.url().includes('recaptcha'));
            if (captchaFrame) {
                // Get the reCAPTCHA sitekey
                const captchaKey = yield page.evaluate(() => {
                    console.log('Getting captcha key');
                    const element = document.querySelector('.g-recaptcha');
                    return (element === null || element === void 0 ? void 0 : element.getAttribute('data-sitekey')) || null;
                });
                if (!captchaKey) {
                    throw new Error('Could not find reCAPTCHA sitekey');
                }
                // Solve the captcha
                const captchaSolutionString = yield (0, CapMonsterImp_1.solveCaptchaV2)({
                    key: captchaKey,
                    url: SUCIVE_MULTAS_URL
                });
                // Inject the solution into the reCAPTCHA iframe
                yield page.evaluate((solution) => {
                    var _a;
                    // Try to find the input in different ways
                    let input = document.querySelector('textarea[name="g-recaptcha-response"]');
                    // Create a textarea with g-recaptcha-response if it doesn't exist
                    if (!input) {
                        const textarea = document.createElement('textarea');
                        textarea.setAttribute('name', 'g-recaptcha-response');
                        textarea.style.display = 'none';
                        (_a = document.querySelector('form')) === null || _a === void 0 ? void 0 : _a.appendChild(textarea);
                    }
                    if (input) {
                        input.value = solution;
                    }
                }, captchaSolutionString);
            }
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
            const submitButtonSelector = 'button[name="buttonPanel:buscarLink"]';
            yield page.click(submitButtonSelector);
            // Wait for navigation after form submission
            yield page.waitForNavigation({ waitUntil: 'networkidle0' });
            // After form submission and waiting for navigation
            // Look for the "no infractions" label
            const noConvenioText = 'No hay resultados para la consulta';
            // Check if the "no infractions" label exists
            const hasNoConvenioLabel = yield page.evaluate((text) => {
                const elements = Array.from(document.querySelectorAll('label, p, div, span'));
                return elements.some(el => { var _a; return (_a = el.textContent) === null || _a === void 0 ? void 0 : _a.includes(text); });
            }, noConvenioText);
            // Take a screenshot of the results page
            const screenshotBuffer = yield page.screenshot({ fullPage: true });
            // Generate PDF of the page
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
                imageBuffers: [Buffer.from(screenshotBufferWithDataFilled), Buffer.from(screenshotBuffer)],
                pdfBuffers: [Buffer.from(pdfBufferWithDataFilled), Buffer.from(pdfBufferWithResult)],
                data: {
                    hasConvenio: !hasNoConvenioLabel,
                },
            };
        });
    }
}
const consultarConvenioProcess = new ConsultarConvenioProcess();
const getConsultarConvenioData = (vehicleData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield consultarConvenioProcess.execute(vehicleData);
});
exports.getConsultarConvenioData = getConsultarConvenioData;
