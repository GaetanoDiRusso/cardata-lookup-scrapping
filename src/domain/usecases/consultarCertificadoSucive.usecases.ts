import { saveImage, savePdf } from "../../media";
import { ConsultarDeudaData } from "../../websitesScrapping/ConsultarDeuda";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { solicitarCertificadoSucive, SolicitarCertificadoSuciveDataResult, RequesterData } from "../../websitesScrapping/SolicitarCertificadoSucive";

export type SolicitarCertificadoSuciveUseCaseRes = SolicitarCertificadoSuciveDataResult;
export type SolicitarCertificadoSuciveUseCaseParams = {
    vehicleData: ConsultarDeudaData;
    requesterData: RequesterData;
}

export const solicitarCertificadoSuciveUseCase = async (currentUser: any, params: SolicitarCertificadoSuciveUseCaseParams): Promise<IGenerateAndSaveScrappedDataRes<SolicitarCertificadoSuciveUseCaseRes>> => {
    const { userId } = currentUser;
    const { vehicleData, requesterData } = params;

    const { imagePaths, pdfPaths, data } = await solicitarCertificadoSucive(vehicleData, requesterData);

    const imagePathsUrls = imagePaths.map((image, index) => saveImage(image, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_consulta_certificado_sucive_${index}.png`));
    const pdfPathsUrls = pdfPaths.map((pdf, index) => savePdf(pdf, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_consulta_certificado_sucive_${index}.pdf`));

    return {
        imagePathsUrls,
        pdfPathsUrls,
        data
    };
}