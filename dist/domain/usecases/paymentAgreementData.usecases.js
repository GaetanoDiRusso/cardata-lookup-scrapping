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
exports.generateAndSavePaymentAgreementData = void 0;
const ConsultarConvenio_1 = require("../../websitesScrapping/ConsultarConvenio");
const BaseScrapingUseCase_1 = require("./BaseScrapingUseCase");
class PaymentAgreementDataUseCase extends BaseScrapingUseCase_1.BaseScrapingUseCase {
    getScrapingFunction() {
        return (params) => (0, ConsultarConvenio_1.getConsultarConvenioData)(params.vehicleData);
    }
    getScrapingParams(currentUser, params) {
        return params;
    }
    getBasePath(currentUser, params) {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }
    getErrorMessage() {
        return "Failed to process payment agreement data";
    }
}
// Singleton instance
const paymentAgreementDataUseCase = new PaymentAgreementDataUseCase();
/**
 * @function generateAndSavePaymentAgreementData
 * @description Genera y guarda datos de convenios de pago usando Cloudinary para almacenamiento
 * @param currentUser - Información del usuario actual
 * @param vehicleData - Datos del vehículo para consultar
 * @returns Promise con las URLs firmadas de los archivos y los datos del scraping
 */
const generateAndSavePaymentAgreementData = (currentUser, vehicleData) => __awaiter(void 0, void 0, void 0, function* () {
    return paymentAgreementDataUseCase.execute(currentUser, { vehicleData });
});
exports.generateAndSavePaymentAgreementData = generateAndSavePaymentAgreementData;
