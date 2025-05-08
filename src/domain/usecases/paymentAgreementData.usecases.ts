import { ConsultarConvenioData, ConsultarConvenioDataResult, getConsultarConvenioData } from "../../websitesScrapping/ConsultarConvenio";
import { saveImage, savePdf } from "../../media";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";

export type GenerateAndSavePaymentAgreementDataRes = ConsultarConvenioDataResult;

export const generateAndSavePaymentAgreementData = async (currentUser: any, vehicleData: ConsultarConvenioData): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSavePaymentAgreementDataRes>> => {
    const { userId } = currentUser;

    const { imagePaths, pdfPaths, data } = await getConsultarConvenioData(vehicleData);

    const imagePathsUrls = imagePaths.map((image, index) => saveImage(image, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_convenio_${index}.png`));
    const pdfPathsUrls = pdfPaths.map((pdf, index) => savePdf(pdf, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_convenio_${index}.pdf`));

    return {
        imagePathsUrls,
        pdfPathsUrls,
        data
    };
}