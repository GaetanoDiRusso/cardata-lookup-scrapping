import { ConsultarInfraccionesData, ConsultarInfraccionesDataResult, getConsultarInfraccionesData } from "../../websitesScrapping/ConsultarInfracciones";
import { saveImage, savePdf } from "../../media";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";

export type GenerateAndSaveInfractionDataRes = ConsultarInfraccionesDataResult;

export const generateAndSaveInfractionData = async (currentUser: any, vehicleData: ConsultarInfraccionesData): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSaveInfractionDataRes>> => {
    const { userId } = currentUser;

    const { imagePaths, pdfPaths, data } = await getConsultarInfraccionesData(vehicleData);

    const imagePathsUrls = imagePaths.map((image, index) => saveImage(image, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_infracciones_${index}.png`));
    const pdfPathsUrls = pdfPaths.map((pdf, index) => savePdf(pdf, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_infracciones_${index}.pdf`));

    return {
        imagePathsUrls,
        pdfPathsUrls,
        data
    };
}