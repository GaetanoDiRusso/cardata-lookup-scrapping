import { ConsultarDeudaData, ConsultarDeudaDataResult, getConsultarDeudaData } from "../../websitesScrapping/ConsultarDeuda";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { BaseScrapingUseCase, BaseUser, BaseParams } from "./BaseScrapingUseCase";
import { IWebsiteScrappingResult } from "../../websitesScrapping/IWebsiteScrappingResult";

export type GenerateAndSaveDebtDataRes = ConsultarDeudaDataResult;

interface DebtDataParams extends BaseParams {
    vehicleData: ConsultarDeudaData;
}

class DebtDataUseCase extends BaseScrapingUseCase<ConsultarDeudaDataResult, DebtDataParams, BaseUser> {
    protected getScrapingFunction() {
        return (params: DebtDataParams): Promise<IWebsiteScrappingResult<ConsultarDeudaDataResult>> => {
            return getConsultarDeudaData(params.vehicleData);
        };
    }

    protected getScrapingParams(currentUser: BaseUser, params: DebtDataParams): DebtDataParams {
        return params;
    }

    protected getBasePath(currentUser: BaseUser, params: DebtDataParams): string {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }

    protected getErrorMessage(): string {
        return "Failed to process debt data";
    }
}

// Singleton instance
const debtDataUseCase = new DebtDataUseCase();

export const generateAndSaveDebtData = async (currentUser: BaseUser, vehicleData: ConsultarDeudaData): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSaveDebtDataRes>> => {
    return debtDataUseCase.execute(currentUser, { vehicleData });
};