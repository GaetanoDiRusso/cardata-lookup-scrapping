import { ConsultarConvenioData, ConsultarConvenioDataResult, getConsultarConvenioData } from "../../websitesScrapping/ConsultarConvenio";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { BaseScrapingUseCase, BaseUser, BaseParams } from "./BaseScrapingUseCase";

export type GenerateAndSavePaymentAgreementDataRes = ConsultarConvenioDataResult;

interface PaymentAgreementDataParams extends BaseParams {
    vehicleData: ConsultarConvenioData;
}

class PaymentAgreementDataUseCase extends BaseScrapingUseCase<ConsultarConvenioDataResult, PaymentAgreementDataParams, BaseUser> {
    protected getScrapingFunction() {
        return (params: PaymentAgreementDataParams) => getConsultarConvenioData(params.vehicleData);
    }

    protected getScrapingParams(currentUser: BaseUser, params: PaymentAgreementDataParams): PaymentAgreementDataParams {
        return params;
    }

    protected getBasePath(currentUser: BaseUser, params: PaymentAgreementDataParams): string {
        const timestamp = Date.now();
        return `servicio-automotor/users/${currentUser.userId}/vehicles/${params.vehicleData.matricula}/${timestamp}`;
    }

    protected getErrorMessage(): string {
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
export const generateAndSavePaymentAgreementData = async (
    currentUser: BaseUser, 
    vehicleData: ConsultarConvenioData
): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSavePaymentAgreementDataRes>> => {
    return paymentAgreementDataUseCase.execute(currentUser, { vehicleData });
};