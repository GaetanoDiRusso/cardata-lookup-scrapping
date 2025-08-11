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
exports.solicitarCertificadoSucive = void 0;
const CapMonsterImp_1 = require("../../captcha/CapMonsterImp");
const utils_1 = require("../utils");
const BaseScrapingProcess_1 = require("../BaseScrapingProcess");
const SOLICITAR_CERTIFICADO_SUCIVE_URL = 'https://www.sucive.gub.uy/solicitud_certificado_sucive?3';
class SolicitarCertificadoSuciveProcess extends BaseScrapingProcess_1.BaseScrapingProcess {
    performScraping(page, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { vehicleData, requesterData } = input;
            // Sanitize requester identification data
            if (requesterData.identificationType === 'CI') {
                if (requesterData.identificationNumber.length !== 8) {
                    throw new Error('Invalid CI number');
                }
                requesterData.identificationNumber = requesterData.identificationNumber.replace(/\./g, '');
                requesterData.identificationNumber = requesterData.identificationNumber.replace(/\-/g, '');
                requesterData.identificationNumber = requesterData.identificationNumber.slice(0, -1) + '-' + requesterData.identificationNumber.slice(-1);
            }
            // Navigate to the SUCIVE website
            yield page.goto(SOLICITAR_CERTIFICADO_SUCIVE_URL, {
                waitUntil: 'networkidle2'
            });
            // Fill the form with vehicle data
            yield page.type('#matricula', vehicleData.matricula);
            yield page.type('#padron', vehicleData.padron.toString());
            yield page.select('#departamento', (0, utils_1.getDepartmentNumberFromCode)(vehicleData.departamento));
            // Take a screenshot with the initial data filled
            const initialDataScreenshotBuffer = yield page.screenshot({ fullPage: true });
            // Generate PDF of the page
            const initialDataPdfBuffer = yield page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });
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
                    url: SOLICITAR_CERTIFICADO_SUCIVE_URL
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
            // Click the submit button
            const submitButtonSelector = 'button[name="buttonPanel:buscarLink"]';
            yield page.click(submitButtonSelector);
            // Wait for navigation and check for error message
            yield page.waitForNavigation({ waitUntil: 'networkidle0' });
            const errorMessage = yield page.evaluate(() => {
                const errorElement = document.querySelector('.feedbackPanelERROR span');
                return errorElement ? errorElement.textContent : null;
            });
            if (errorMessage === null || errorMessage === void 0 ? void 0 : errorMessage.includes('Ya existe un trámite pendiente de pago')) {
                // TODO: Add a custom error
                throw new Error('Ya existe un trámite pendiente de pago para este vehículo');
            }
            // Let's fill the form with requester data
            yield page.type('#nombreSolicitante', requesterData.fullName);
            const identificationTypeMap = {
                CI: "0",
                RUT: "1",
            };
            yield page.select('#tipoDoc', identificationTypeMap[requesterData.identificationType].toString());
            yield page.type('#nroDoc', requesterData.identificationNumber);
            yield page.type('#correo', requesterData.email);
            yield page.type('#correoConfirm', requesterData.email);
            yield page.type('#telefono', requesterData.phoneNumber || '');
            yield page.type('#domicilio', requesterData.address || '');
            // Take a screenshot with the form filled
            const formFilledScreenshotBuffer = yield page.screenshot({ fullPage: true });
            // Generate PDF of the page
            const formFilledPdfBuffer = yield page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });
            // Check for presence of reCAPTCHA
            const captchaFrame2 = yield page.frames().find(frame => frame.url().includes('recaptcha'));
            if (captchaFrame2) {
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
                    url: SOLICITAR_CERTIFICADO_SUCIVE_URL
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
            const submitButtonSelector2 = 'button[name="buttonPanel:buscarLink"]';
            yield page.click(submitButtonSelector2);
            // Wait for navigation after form submission
            yield page.waitForNavigation({ waitUntil: 'networkidle0' });
            // Take a screenshot with the form filled
            const formFilledScreenshotBuffer2 = yield page.screenshot({ fullPage: true });
            // Generate PDF of the page
            const formFilledPdfBuffer2 = yield page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });
            // Get the transaction number
            const transactionNumber = yield page.evaluate(() => {
                const element = document.querySelector('#numeroTramite');
                return element ? element.textContent : null;
            });
            return {
                imageBuffers: [Buffer.from(initialDataScreenshotBuffer), Buffer.from(formFilledScreenshotBuffer), Buffer.from(formFilledScreenshotBuffer2)],
                pdfBuffers: [Buffer.from(initialDataPdfBuffer), Buffer.from(formFilledPdfBuffer), Buffer.from(formFilledPdfBuffer2)],
                data: {
                    transactionNumber: transactionNumber || undefined
                },
            };
        });
    }
}
const solicitarCertificadoSuciveProcess = new SolicitarCertificadoSuciveProcess();
const solicitarCertificadoSucive = (vehicleData, requesterData) => __awaiter(void 0, void 0, void 0, function* () {
    return yield solicitarCertificadoSuciveProcess.execute({ vehicleData, requesterData }, false);
});
exports.solicitarCertificadoSucive = solicitarCertificadoSucive;
