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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitirCertificadoSuciveData = void 0;
const CapMonsterImp_1 = require("../../captcha/CapMonsterImp");
const utils_1 = require("../utils");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const BaseScrapingProcess_1 = require("../BaseScrapingProcess");
const puppeteer_extra_1 = require("puppeteer-extra");
const puppeteer_extra_plugin_user_preferences_1 = __importDefault(require("puppeteer-extra-plugin-user-preferences"));
const EMITIR_CERTIFICADO_SUCIVE_URL = 'https://www.sucive.gub.uy/consulta_certificado_sucive?3';
class EmitirCertificadoSuciveProcess extends BaseScrapingProcess_1.BaseScrapingProcess {
    launchBrowser() {
        return __awaiter(this, arguments, void 0, function* (headless = true) {
            const puppeteerExtra = new puppeteer_extra_1.PuppeteerExtra(require('puppeteer'));
            puppeteerExtra.use((0, puppeteer_extra_plugin_user_preferences_1.default)({
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
            return yield puppeteerExtra.launch({
                headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                downloadBehavior: {
                    policy: 'allow',
                    downloadPath: path_1.default.join(process.cwd(), 'puppeteer-downloads')
                }
            });
        });
    }
    performScraping(page, input) {
        return __awaiter(this, void 0, void 0, function* () {
            const { vehicleData, requestNumber } = input;
            // Navigate to the SUCIVE website
            yield page.goto(EMITIR_CERTIFICADO_SUCIVE_URL, {
                waitUntil: 'networkidle2'
            });
            // Fill the form with vehicle data
            yield page.type('#matricula', vehicleData.matricula);
            yield page.type('#padron', vehicleData.padron.toString());
            yield page.select('#departamento', (0, utils_1.getDepartmentNumberFromCode)(vehicleData.departamento));
            yield page.type('#nroTramite', requestNumber);
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
                    url: EMITIR_CERTIFICADO_SUCIVE_URL
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
            yield page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 120000 });
            // Wait for and click the download button
            const downloadButtonSelector = 'a.button[title="Descargar certificado"]';
            yield page.waitForSelector(downloadButtonSelector);
            // Set a temporary unique download path
            const downloadPathFolder = path_1.default.join(process.cwd(), 'puppeteer-downloads', `certificado-${Date.now()}-${vehicleData.matricula}-${requestNumber}`);
            const cdpSession2 = yield page.createCDPSession();
            cdpSession2.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: downloadPathFolder
            });
            const downloadPath = path_1.default.join(downloadPathFolder, 'page.pdf');
            yield page.click(downloadButtonSelector);
            // Try to read the PDF, wait one second before trying.
            // Repeat until the file is found. Max 5 attempts.
            let pdfBuffer = null;
            for (let i = 0; i < 5; i++) {
                try {
                    // Wait one second before trying
                    yield new Promise(resolve => setTimeout(resolve, 1000));
                    // Save the PDF to a buffer
                    pdfBuffer = (0, fs_1.readFileSync)(downloadPath);
                    break;
                }
                catch (error) {
                    console.error(`Error getting "emitir certificado" PDF for ${vehicleData.matricula} ${vehicleData.padron} ${requestNumber} - Attempt ${i + 1} - Time: ${new Date().toISOString()}:`, error);
                }
            }
            if (!pdfBuffer) {
                throw new Error('Could not get "emitir certificado" PDF');
            }
            // Delete the file
            (0, fs_1.unlinkSync)(downloadPath);
            // Delete the folder
            (0, fs_1.rmdirSync)(downloadPathFolder);
            return {
                imageBuffers: [],
                pdfBuffers: [pdfBuffer],
                data: {},
            };
        });
    }
}
const emitirCertificadoSuciveProcess = new EmitirCertificadoSuciveProcess();
const emitirCertificadoSuciveData = (vehicleData, requestNumber) => __awaiter(void 0, void 0, void 0, function* () {
    return yield emitirCertificadoSuciveProcess.execute({ vehicleData, requestNumber }, false);
});
exports.emitirCertificadoSuciveData = emitirCertificadoSuciveData;
