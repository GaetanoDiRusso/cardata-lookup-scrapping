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
exports.generateAndSaveDebtData = void 0;
const ConsultarDeuda_1 = require("../../websitesScrapping/ConsultarDeuda");
const BaseScrapingUseCase_1 = require("./BaseScrapingUseCase");
class DebtDataUseCase extends BaseScrapingUseCase_1.BaseScrapingUseCase {
    getScrapingFunction() {
        return (params) => {
            return (0, ConsultarDeuda_1.getConsultarDeudaData)(params.vehicleData);
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
        return "Failed to process debt data";
    }
}
// Singleton instance
const debtDataUseCase = new DebtDataUseCase();
const generateAndSaveDebtData = (currentUser, vehicleData) => __awaiter(void 0, void 0, void 0, function* () {
    return debtDataUseCase.execute(currentUser, { vehicleData });
});
exports.generateAndSaveDebtData = generateAndSaveDebtData;
