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
exports.generateAndSaveInfractionData = void 0;
const ConsultarInfracciones_1 = require("../../websitesScrapping/ConsultarInfracciones");
const BaseScrapingUseCase_1 = require("./BaseScrapingUseCase");
class InfractionDataUseCase extends BaseScrapingUseCase_1.BaseScrapingUseCase {
    getScrapingFunction() {
        return (params) => (0, ConsultarInfracciones_1.getConsultarInfraccionesData)(params.vehicleData);
    }
    getScrapingParams(currentUser, params) {
        return params;
    }
    getBasePath(currentUser, params) {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }
    getErrorMessage() {
        return "Failed to process infraction data";
    }
}
// Singleton instance
const infractionDataUseCase = new InfractionDataUseCase();
/**
 * @function generateAndSaveInfractionData
 * @description Genera y guarda datos de infracciones usando Cloudinary para almacenamiento
 * @param currentUser - Información del usuario actual
 * @param vehicleData - Datos del vehículo para consultar
 * @returns Promise con las URLs firmadas de los archivos y los datos del scraping
 */
const generateAndSaveInfractionData = (currentUser, vehicleData) => __awaiter(void 0, void 0, void 0, function* () {
    return infractionDataUseCase.execute(currentUser, { vehicleData });
});
exports.generateAndSaveInfractionData = generateAndSaveInfractionData;
