import { ConsultarMatriculaRequeridaData, ConsultarMatriculaRequeridaDataResult, getConsultarMatriculaRequeridaData } from "../../websitesScrapping/ConsultarMatriculaRequerida";
import { saveImage, savePdf } from "../../media";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";

export type GenerateAndSaveMatriculaRequeridaDataRes = ConsultarMatriculaRequeridaDataResult;

export const generateAndSaveMatriculaRequeridaData = async (currentUser: any, vehicleData: ConsultarMatriculaRequeridaData): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSaveMatriculaRequeridaDataRes>> => {
    const { userId } = currentUser;

    // Remove spaces from matricula and convert to uppercase
    vehicleData.matricula = vehicleData.matricula.toUpperCase().replace(/ /g, '');

    const { imagePaths, pdfPaths, data } = await getConsultarMatriculaRequeridaData(vehicleData);

    const imagePathsUrls = imagePaths.map((image, index) => saveImage(image, `${userId}_${vehicleData.matricula}_matricula_requerida_${index}.png`));
    const pdfPathsUrls = pdfPaths.map((pdf, index) => savePdf(pdf, `${userId}_${vehicleData.matricula}_matricula_requerida_${index}.pdf`));

    return {
        imagePathsUrls,
        pdfPathsUrls,
        data
    };
}