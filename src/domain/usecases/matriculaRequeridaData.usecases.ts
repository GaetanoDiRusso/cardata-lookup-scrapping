import { ConsultarMatriculaRequeridaData, ConsultarMatriculaRequeridaDataResult, getConsultarMatriculaRequeridaData } from "../../websitesScrapping/ConsultarMatriculaRequerida";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { BaseScrapingUseCase, BaseUser, BaseParams } from "./BaseScrapingUseCase";
import { Logger } from "../Logger";

export type GenerateAndSaveMatriculaRequeridaDataRes = ConsultarMatriculaRequeridaDataResult;

interface MatriculaRequeridaDataParams extends BaseParams {
    vehicleData: ConsultarMatriculaRequeridaData;
}

class MatriculaRequeridaDataUseCase extends BaseScrapingUseCase<ConsultarMatriculaRequeridaDataResult, MatriculaRequeridaDataParams, BaseUser> {
    protected getScrapingFunction() {
        return (params: MatriculaRequeridaDataParams, logger: Logger) => getConsultarMatriculaRequeridaData(params.vehicleData, logger);
    }

    protected getScrapingParams(currentUser: BaseUser, params: MatriculaRequeridaDataParams): MatriculaRequeridaDataParams {
        return params;
    }

    protected getBasePath(currentUser: BaseUser, params: MatriculaRequeridaDataParams): string {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }

    protected getErrorMessage(): string {
        return "Failed to process matricula requerida data";
    }
}

// Singleton instance
const matriculaRequeridaDataUseCase = new MatriculaRequeridaDataUseCase();

/**
 * @function generateAndSaveMatriculaRequeridaData
 * @description Genera y guarda datos de matrícula requerida usando Cloudinary para almacenamiento
 * @param currentUser - Información del usuario actual
 * @param vehicleData - Datos del vehículo para consultar
 * @returns Promise con las URLs firmadas de los archivos y los datos del scraping
 */
export const generateAndSaveMatriculaRequeridaData = async (
    currentUser: BaseUser, 
    vehicleData: ConsultarMatriculaRequeridaData
): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSaveMatriculaRequeridaDataRes>> => {
    return matriculaRequeridaDataUseCase.execute(currentUser, { vehicleData });
};