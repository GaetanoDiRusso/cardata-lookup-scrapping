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
exports.emitirCertificadoSuciveDataUseCase = void 0;
const EmitirCertificadoSucive_1 = require("../../websitesScrapping/EmitirCertificadoSucive");
const BaseScrapingUseCase_1 = require("./BaseScrapingUseCase");
class EmitirCertificadoSuciveUseCase extends BaseScrapingUseCase_1.BaseScrapingUseCase {
    getScrapingFunction() {
        return (params) => {
            return (0, EmitirCertificadoSucive_1.emitirCertificadoSuciveData)(params.vehicleData, params.requestNumber);
        };
    }
    getScrapingParams(currentUser, params) {
        return params;
    }
    getBasePath(currentUser, params) {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }
    getErrorMessage() {
        return "Failed to process emitir certificado sucive data";
    }
}
// Singleton instance
const emitirCertificadoSuciveUseCase = new EmitirCertificadoSuciveUseCase();
const emitirCertificadoSuciveDataUseCase = (currentUser, params) => __awaiter(void 0, void 0, void 0, function* () {
    return emitirCertificadoSuciveUseCase.execute(currentUser, params);
});
exports.emitirCertificadoSuciveDataUseCase = emitirCertificadoSuciveDataUseCase;
