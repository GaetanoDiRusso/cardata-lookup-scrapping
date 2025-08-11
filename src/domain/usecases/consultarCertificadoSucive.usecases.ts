import { solicitarCertificadoSucive, SolicitarCertificadoSuciveDataResult, RequesterData } from "../../websitesScrapping/SolicitarCertificadoSucive";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { BaseScrapingUseCase, BaseUser, BaseParams } from "./BaseScrapingUseCase";
import { ConsultarDeudaData } from "../../websitesScrapping/SolicitarCertificadoSucive";

export type SolicitarCertificadoSuciveUseCaseParams = {
    vehicleData: ConsultarDeudaData;
    requesterData: RequesterData;
}

export type GenerateAndSaveConsultarCertificadoSuciveDataRes = SolicitarCertificadoSuciveDataResult;

interface ConsultarCertificadoSuciveParams extends BaseParams {
    vehicleData: ConsultarDeudaData;
    requesterData: RequesterData;
}

class ConsultarCertificadoSuciveUseCase extends BaseScrapingUseCase<SolicitarCertificadoSuciveDataResult, ConsultarCertificadoSuciveParams, BaseUser> {
    protected getScrapingFunction() {
        return (params: ConsultarCertificadoSuciveParams) => solicitarCertificadoSucive(params.vehicleData, params.requesterData);
    }

    protected getScrapingParams(currentUser: BaseUser, params: ConsultarCertificadoSuciveParams): ConsultarCertificadoSuciveParams {
        return params;
    }

    protected getBasePath(currentUser: BaseUser, params: ConsultarCertificadoSuciveParams): string {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }

    protected getErrorMessage(): string {
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
export const solicitarCertificadoSuciveUseCase = async (
    currentUser: BaseUser, 
    params: SolicitarCertificadoSuciveUseCaseParams
): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSaveConsultarCertificadoSuciveDataRes>> => {
    return consultarCertificadoSuciveUseCase.execute(currentUser, params);
};