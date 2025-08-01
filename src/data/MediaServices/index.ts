import { CloudinaryMediaService } from './CloudinaryMediaService';
import { IMediaService } from '../../domain/interfaces/IMediaService';

/**
 * @description Instancia del servicio de media configurada para Cloudinary
 * Esta instancia se puede reemplazar fácilmente por otra implementación
 */
export const mediaService: IMediaService = new CloudinaryMediaService();

export { CloudinaryMediaService } from './CloudinaryMediaService';
export { IMediaService } from '../../domain/interfaces/IMediaService'; 