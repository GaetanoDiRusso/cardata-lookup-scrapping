import { ConsultarDeudaDataResult, getConsultarDeudaData } from "../../websitesScrapping/ConsultarDeuda";
import { saveImage, savePdf } from "../../media";
import { ConsultarDeudaData } from "../../websitesScrapping/ConsultarDeuda";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";

export type GenerateAndSaveDebtDataRes = ConsultarDeudaDataResult;

export const generateAndSaveDebtData = async (currentUser: any, vehicleData: ConsultarDeudaData): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSaveDebtDataRes>> => {
    const { userId } = currentUser;

    const { imagePaths, pdfPaths, data } = await getConsultarDeudaData(vehicleData);

    const imagePathsUrls = imagePaths.map((image, index) => saveImage(image, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_deuda_${index}.png`));
    const pdfPathsUrls = pdfPaths.map((pdf, index) => savePdf(pdf, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_deuda_${index}.pdf`));

    return {
        imagePathsUrls,
        pdfPathsUrls,
        data
    };
}