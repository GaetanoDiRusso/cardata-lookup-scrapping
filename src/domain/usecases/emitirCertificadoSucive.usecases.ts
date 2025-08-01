import { EmitirCertificadoSuciveData, EmitirCertificadoSuciveDataResult, emitirCertificadoSuciveData } from "../../websitesScrapping/EmitirCertificadoSucive";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { BaseScrapingUseCase, BaseUser, BaseParams } from "./BaseScrapingUseCase";
import { IWebsiteScrappingResult } from "../../websitesScrapping/IWebsiteScrappingResult";

export type GenerateAndSaveEmitirCertificadoSuciveDataRes = EmitirCertificadoSuciveDataResult;

interface EmitirCertificadoParams extends BaseParams {
    vehicleData: EmitirCertificadoSuciveData;
    requestNumber: string;
}

class EmitirCertificadoSuciveUseCase extends BaseScrapingUseCase<EmitirCertificadoSuciveDataResult, EmitirCertificadoParams, BaseUser> {
    protected getScrapingFunction() {
        return (params: EmitirCertificadoParams): Promise<IWebsiteScrappingResult<EmitirCertificadoSuciveDataResult>> => {
            return emitirCertificadoSuciveData(params.vehicleData, params.requestNumber);
        };
    }

    protected getScrapingParams(currentUser: BaseUser, params: EmitirCertificadoParams): EmitirCertificadoParams {
        return params;
    }

    protected getBasePath(currentUser: BaseUser, params: EmitirCertificadoParams): string {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }

    protected getErrorMessage(): string {
        return "Failed to process emitir certificado sucive data";
    }
}

// Singleton instance
const emitirCertificadoSuciveUseCase = new EmitirCertificadoSuciveUseCase();

export const emitirCertificadoSuciveDataUseCase = async (currentUser: BaseUser, params: { vehicleData: EmitirCertificadoSuciveData, requestNumber: string }): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSaveEmitirCertificadoSuciveDataRes>> => {
    return emitirCertificadoSuciveUseCase.execute(currentUser, params);
};