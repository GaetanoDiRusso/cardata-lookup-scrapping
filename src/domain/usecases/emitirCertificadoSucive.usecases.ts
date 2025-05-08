import { emitirCertificadoSuciveData, EmitirCertificadoSuciveDataResult } from "../../websitesScrapping/EmitirCertificadoSucive";
import { saveImage, savePdf } from "../../media";
import { ConsultarDeudaData } from "../../websitesScrapping/ConsultarDeuda";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";

export type EmitirCertificadoSuciveDataRes = EmitirCertificadoSuciveDataResult;

export const emitirCertificadoSuciveDataUseCase = async (currentUser: any, params: { vehicleData: ConsultarDeudaData, requestNumber: string }): Promise<IGenerateAndSaveScrappedDataRes<EmitirCertificadoSuciveDataRes>> => {
    const { userId } = currentUser;
    const { vehicleData, requestNumber } = params;

    const { imagePaths, pdfPaths, data } = await emitirCertificadoSuciveData(vehicleData, requestNumber);

    const imagePathsUrls = imagePaths.map((image, index) => saveImage(image, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_deuda_${index}.png`));
    const pdfPathsUrls = pdfPaths.map((pdf, index) => savePdf(pdf, `${userId}_${vehicleData.matricula}_${vehicleData.padron}_deuda_${index}.pdf`));

    return {
        imagePathsUrls,
        pdfPathsUrls,
        data
    };
}