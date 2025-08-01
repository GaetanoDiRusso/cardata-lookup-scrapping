import { CloudinaryMediaService } from './CloudinaryMediaService';
import { IMediaService } from '../../domain/interfaces/IMediaService';

/**
 * @description Instancia del servicio de media configurada para Cloudinary
 * Esta instancia se puede reemplazar fácilmente por otra implementación
 */
export const mediaService: IMediaService = new CloudinaryMediaService();

/**
 * @description Función para obtener una nueva instancia del servicio de media
 * Útil para testing o cuando se necesita una instancia específica
 */
export const createMediaService = (options?: {
    cloudName?: string;
    apiKey?: string;
    apiSecret?: string;
    defaultFolder?: string;
}): IMediaService => {
    return new CloudinaryMediaService(options);
};

export { CloudinaryMediaService } from './CloudinaryMediaService';
export { IMediaService } from '../../domain/interfaces/IMediaService'; 