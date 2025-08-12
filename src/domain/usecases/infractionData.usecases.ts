import { ConsultarInfraccionesData, ConsultarInfraccionesDataResult, getConsultarInfraccionesData } from "../../websitesScrapping/ConsultarInfracciones";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { Logger } from "../Logger";
import { BaseScrapingUseCase, BaseUser, BaseParams } from "./BaseScrapingUseCase";

export type GenerateAndSaveInfractionDataRes = ConsultarInfraccionesDataResult;

interface InfractionDataParams extends BaseParams {
    vehicleData: ConsultarInfraccionesData;
}

class InfractionDataUseCase extends BaseScrapingUseCase<ConsultarInfraccionesDataResult, InfractionDataParams, BaseUser> {
    protected getScrapingFunction() {
        return (params: InfractionDataParams, logger: Logger) => getConsultarInfraccionesData(params.vehicleData, logger);
    }

    protected getScrapingParams(currentUser: BaseUser, params: InfractionDataParams): InfractionDataParams {
        return params;
    }

    protected getBasePath(currentUser: BaseUser, params: InfractionDataParams): string {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }

    protected getErrorMessage(): string {
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
export const generateAndSaveInfractionData = async (
    currentUser: BaseUser, 
    vehicleData: ConsultarInfraccionesData
): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSaveInfractionDataRes>> => {
    return infractionDataUseCase.execute(currentUser, { vehicleData });
};