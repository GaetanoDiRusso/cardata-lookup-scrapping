import { solicitarCertificadoSucive, SolicitarCertificadoSuciveDataResult, RequesterData } from "../../websitesScrapping/SolicitarCertificadoSucive";
import { IGenerateAndSaveScrappedDataRes } from "../IGenerateAndSaveScrappedDataRes";
import { mediaService } from "../../data/MediaServices";
import { FileUpload } from "../interfaces/IMediaService";
import { ConsultarDeudaData } from "../../websitesScrapping/SolicitarCertificadoSucive";

export type SolicitarCertificadoSuciveUseCaseParams = {
    vehicleData: ConsultarDeudaData;
    requesterData: RequesterData;
}

export type GenerateAndSaveConsultarCertificadoSuciveDataRes = SolicitarCertificadoSuciveDataResult;

export const solicitarCertificadoSuciveUseCase = async (currentUser: any, params: SolicitarCertificadoSuciveUseCaseParams): Promise<IGenerateAndSaveScrappedDataRes<GenerateAndSaveConsultarCertificadoSuciveDataRes>> => {
    const { userId } = currentUser;
    const { vehicleData, requesterData } = params;

    try {
        // Ejecutar scraping para obtener los archivos
        const { imageBuffers, pdfBuffers, data } = await solicitarCertificadoSucive(vehicleData, requesterData);

        // Generar IDs únicos para los archivos
        const timestamp = Date.now();
        const basePath = `servicio-automotor/users/${userId}/vehicles/${vehicleData.matricula}/${timestamp}`;

        // Preparar archivos para subir a Cloudinary
        const filesToUpload = [
            // Screenshots
            ...imageBuffers.map((imageBuffer, index) => ({
                fileId: `${basePath}/screenshot-${index}.png`,
                buffer: imageBuffer,
                options: {
                    resourceType: 'image' as const,
                    accessMode: 'authenticated' as const,
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' },
                        { width: 1200, height: 800, crop: 'limit' }
                    ]
                }
            })),
            // PDFs
            ...pdfBuffers.map((pdfBuffer, index) => ({
                fileId: `${basePath}/report-${index}.pdf`,
                buffer: pdfBuffer,
                options: {
                    resourceType: 'image' as const, // PDFs se manejan como 'image' en Cloudinary por defecto
                    accessMode: 'authenticated' as const
                }
            }))
        ];

        // Subir archivos a Cloudinary
        const uploadedFiles = await mediaService.uploadFiles(filesToUpload);

        // Separar URLs por tipo
        const screenshotFiles = uploadedFiles.filter(file => file.id.includes('screenshot'));
        const pdfFiles = uploadedFiles.filter(file => file.id.includes('report'));

        // Obtener URLs firmadas con mayor tiempo de expiración
        const imageUrls = await Promise.all(
            screenshotFiles.map(file => mediaService.getSignedUrl(file.id, { 
                resourceType: 'image',
                expiresIn: 86400 // 24 horas
            }))
        );

        const pdfUrls = await Promise.all(
            pdfFiles.map(file => mediaService.getSignedUrl(file.id, { 
                resourceType: 'image', // PDFs como image
                expiresIn: 86400 // 24 horas
            }))
        );

        // Explicitamente clear buffers from memory
        imageBuffers.length = 0;
        pdfBuffers.length = 0;

        return {
            imagePathsUrls: imageUrls,
            pdfPathsUrls: pdfUrls,
            videoPathsUrls: [], // No video recording for this use case yet
            data
        };

    } catch (error) {
        console.error('Error in solicitarCertificadoSuciveUseCase:', error);
        throw new Error(`Failed to process solicitar certificado sucive data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};