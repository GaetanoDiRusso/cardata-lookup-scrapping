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
exports.solicitarCertificadoSuciveUseCase = void 0;
const SolicitarCertificadoSucive_1 = require("../../websitesScrapping/SolicitarCertificadoSucive");
const BaseScrapingUseCase_1 = require("./BaseScrapingUseCase");
class ConsultarCertificadoSuciveUseCase extends BaseScrapingUseCase_1.BaseScrapingUseCase {
    getScrapingFunction() {
        return (params) => (0, SolicitarCertificadoSucive_1.solicitarCertificadoSucive)(params.vehicleData, params.requesterData);
    }
    getScrapingParams(currentUser, params) {
        return params;
    }
    getBasePath(currentUser, params) {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }
    getErrorMessage() {
        return "Failed to process solicitar certificado sucive data";
    }
}
// Singleton instance
const consultarCertificadoSuciveUseCase = new ConsultarCertificadoSuciveUseCase();
/**
 * @function solicitarCertificadoSuciveUseCase
 * @description Genera y guarda datos de certificado SUCIVE usando Cloudinary para almacenamiento
 * @param currentUser - Información del usuario actual
 * @param params - Datos del vehículo y del solicitante para consultar
 * @returns Promise con las URLs firmadas de los archivos y los datos del scraping
 */
const solicitarCertificadoSuciveUseCase = (currentUser, params) => __awaiter(void 0, void 0, void 0, function* () {
    return consultarCertificadoSuciveUseCase.execute(currentUser, params);
});
exports.solicitarCertificadoSuciveUseCase = solicitarCertificadoSuciveUseCase;
