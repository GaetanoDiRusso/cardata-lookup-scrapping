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
exports.getConsultarDeudaData = void 0;
const CapMonsterImp_1 = require("../../captcha/CapMonsterImp");
const utils_1 = require("../utils");
const BaseScrapingProcess_1 = require("../BaseScrapingProcess");
const SUCIVE_MULTAS_URL = 'https://www.sucive.gub.uy/consulta_deuda?0';
class ConsultarDeudaProcess extends BaseScrapingProcess_1.BaseScrapingProcess {
    performScraping(page, vehicleData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Navigate to the SUCIVE website
            yield page.goto(SUCIVE_MULTAS_URL, {
                waitUntil: 'networkidle2'
            });
            // Fill the form with vehicle data
            yield page.type('#matricula', vehicleData.matricula);
            yield page.type('#padron', vehicleData.padron.toString());
            yield page.select('#departamento', (0, utils_1.getDepartmentNumberFromCode)(vehicleData.departamento));
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
                console.log('captchaSolutionString', captchaSolutionString);
                // Inject the solution into the reCAPTCHA iframe
                yield page.evaluate((solution) => {
                    var _a;
                    console.log('solution', solution);
                    // Try to find the input in different ways
                    let input = document.querySelector('textarea[name="g-recaptcha-response"]');
                    console.log('input', input);
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
            // Click the submit button - you'll need to find the actual selector for the submit button
            const submitButtonSelector = 'button[name="buttonPanel:buscarLink"]';
            yield page.click(submitButtonSelector);
            // Wait for navigation after form submission
            yield page.waitForNavigation({ waitUntil: 'networkidle0' });
            // Find and click all elements with class "label-accordion"
            yield page.evaluate(() => {
                const accordionLabels = document.querySelectorAll('.label-accordion');
                console.log('accordionLabels', accordionLabels);
                accordionLabels.forEach(label => {
                    label.click();
                });
            });
            yield new Promise(resolve => setTimeout(resolve, 1000));
            // Take a screenshot of the results page
            const screenshotBuffer = yield page.screenshot({ fullPage: true });
            // Generate PDF of the page
            const pdfBuffer = yield page.pdf({
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
                data: {},
            };
        });
    }
}
const consultarDeudaProcess = new ConsultarDeudaProcess();
const getConsultarDeudaData = (vehicleData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield consultarDeudaProcess.execute(vehicleData);
});
exports.getConsultarDeudaData = getConsultarDeudaData;
