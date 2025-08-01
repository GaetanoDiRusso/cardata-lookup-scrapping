import { v2 as cloudinary } from 'cloudinary';
import { 
    IMediaService, 
    MediaFile, 
    FileUpload, 
    UploadOptions, 
    SignedUrlOptions, 
    ListFilesOptions, 
    UsageStats, 
    UsageStatsOptions 
} from '../../domain/interfaces/IMediaService';

/**
 * @class CloudinaryMediaService
 * @description Implementación genérica del servicio de media usando Cloudinary
 * @implements IMediaService
 * @author Gaetano Di Russo
 * @version 2.0.0
 */
export class CloudinaryMediaService implements IMediaService {
    private readonly CLOUD_NAME: string;
    private readonly API_KEY: string;
    private readonly API_SECRET: string;
    private readonly DEFAULT_FOLDER: string;

    /**
     * @constructor
     * @description Inicializa el servicio de Cloudinary
     * @param options - Opciones de configuración
     * @throws Error si faltan credenciales requeridas
     */
    constructor(options?: {
        cloudName?: string;
        apiKey?: string;
        apiSecret?: string;
        defaultFolder?: string;
    }) {
        this.CLOUD_NAME = options?.cloudName || process.env.CLOUDINARY_CLOUD_NAME || '';
        this.API_KEY = options?.apiKey || process.env.CLOUDINARY_API_KEY || '';
        this.API_SECRET = options?.apiSecret || process.env.CLOUDINARY_API_SECRET || '';
        this.DEFAULT_FOLDER = options?.defaultFolder || 'media';

        if (!this.CLOUD_NAME || !this.API_KEY || !this.API_SECRET) {
            throw new Error('Cloudinary credentials are required. Please provide cloudName, apiKey, and apiSecret.');
        }

        // Configurar Cloudinary
        cloudinary.config({
            cloud_name: this.CLOUD_NAME,
            api_key: this.API_KEY,
            api_secret: this.API_SECRET
        });
    }

    /**
     * @method uploadFile
     * @description Sube un archivo al servicio de media
     * @param fileId - ID único del archivo (puede incluir carpetas: "users/123/photo.jpg")
     * @param buffer - Contenido del archivo
     * @param options - Opciones de subida
     * @returns Promise con la información del archivo subido
     */
    async uploadFile(fileId: string, buffer: Buffer, options: UploadOptions = {}): Promise<MediaFile> {
        try {
            const { publicId, folder } = this.parseFileId(fileId);
            const resourceType = options.resourceType || this.determineResourceType(fileId);

            // Configurar opciones de subida
            const uploadOptions = {
                public_id: publicId,
                // No especificar folder si ya está en publicId para evitar duplicación
                resource_type: resourceType,
                type: 'upload', // Mantener como 'upload' para URLs correctas
                access_mode: options.accessMode || 'authenticated', // Volver a 'authenticated'
                transformation: options.transformation,
                quality: options.quality,
                format: options.format,
                context: options.metadata
            };

            // Subir archivo
            const result = await this.uploadToCloudinary(buffer, uploadOptions);

            return this.createMediaFile(fileId, result);

        } catch (error) {
            console.error(`Error uploading file ${fileId}:`, error);
            throw new Error(`Failed to upload file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method uploadFiles
     * @description Sube múltiples archivos al servicio de media
     * @param files - Array de archivos a subir
     * @param options - Opciones de subida
     * @returns Promise con la información de todos los archivos subidos
     */
    async uploadFiles(files: FileUpload[], options: UploadOptions = {}): Promise<MediaFile[]> {
        const uploadPromises = files.map(file => 
            this.uploadFile(file.fileId, file.buffer, { ...options, ...file.options })
        );

        return Promise.all(uploadPromises);
    }

    /**
     * @method getSignedUrl
     * @description Obtiene la URL firmada de un archivo
     * @param fileId - ID del archivo
     * @param options - Opciones para generar la URL
     * @returns Promise con la URL firmada
     */
    async getSignedUrl(fileId: string, options: SignedUrlOptions = {}): Promise<string> {
        try {
            const { publicId } = this.parseFileId(fileId);
            const resourceType = options.resourceType || this.determineResourceType(fileId);
            const expiresIn = options.expiresIn || 86400; // 24 horas por defecto (en lugar de 1 hora)

            const signedUrl = cloudinary.url(publicId, {
                resource_type: resourceType,
                sign_url: true,
                secure: true,
                expires_at: Math.round(Date.now() / 1000) + expiresIn,
                transformation: options.transformation,
                format: options.format,
                quality: options.quality,
                fetch_format: 'auto'
            });

            return signedUrl;

        } catch (error) {
            console.error(`Error generating signed URL for ${fileId}:`, error);
            throw new Error(`Failed to generate signed URL for ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method regenerateSignedUrl
     * @description Regenera una URL firmada con un nuevo tiempo de expiración
     * @param fileId - ID del archivo
     * @param options - Opciones para generar la URL
     * @returns Promise con la nueva URL firmada
     */
    async regenerateSignedUrl(fileId: string, options: SignedUrlOptions = {}): Promise<string> {
        try {
            const { publicId } = this.parseFileId(fileId);
            const resourceType = options.resourceType || this.determineResourceType(fileId);
            const expiresIn = options.expiresIn || 86400; // 24 horas por defecto

            return cloudinary.url(publicId, {
                resource_type: resourceType,
                sign_url: true,
                secure: true,
                expires_at: Math.round(Date.now() / 1000) + expiresIn,
                transformation: options.transformation,
                format: options.format,
                quality: options.quality,
                fetch_format: 'auto'
            });

        } catch (error) {
            console.error(`Error regenerating signed URL for ${fileId}:`, error);
            throw new Error(`Failed to regenerate signed URL for ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method validateSignedUrl
     * @description Valida si una URL firmada sigue siendo válida
     * @param url - URL firmada a validar
     * @returns Promise que se resuelve a true si es válida, false en caso contrario
     */
    async validateSignedUrl(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error('Error validating signed URL:', error);
            return false;
        }
    }

    /**
     * @method deleteFile
     * @description Elimina un archivo del servicio de media
     * @param fileId - ID del archivo a eliminar
     * @returns Promise que se resuelve cuando se elimina el archivo
     */
    async deleteFile(fileId: string): Promise<void> {
        try {
            const { publicId } = this.parseFileId(fileId);
            const resourceType = this.determineResourceType(fileId);

            await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType
            });

            console.log(`File ${fileId} deleted successfully`);

        } catch (error) {
            console.error(`Error deleting file ${fileId}:`, error);
            throw new Error(`Failed to delete file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method deleteFiles
     * @description Elimina múltiples archivos del servicio de media
     * @param fileIds - Array de IDs de archivos a eliminar
     * @returns Promise que se resuelve cuando se eliminan todos los archivos
     */
    async deleteFiles(fileIds: string[]): Promise<void> {
        const deletePromises = fileIds.map(fileId => this.deleteFile(fileId));
        await Promise.all(deletePromises);
    }

    /**
     * @method deleteFolder
     * @description Elimina todos los archivos de una carpeta
     * @param folderPath - Ruta de la carpeta (ej: "users/123/")
     * @returns Promise que se resuelve cuando se eliminan todos los archivos
     */
    async deleteFolder(folderPath: string): Promise<void> {
        try {
            // Listar todos los archivos en la carpeta
            const files = await this.listFiles(folderPath, { maxResults: 1000 });
            
            // Eliminar todos los archivos
            const deletePromises = files.map(file => this.deleteFile(file.id));
            await Promise.all(deletePromises);

            console.log(`Folder ${folderPath} deleted successfully`);

        } catch (error) {
            console.error(`Error deleting folder ${folderPath}:`, error);
            throw new Error(`Failed to delete folder ${folderPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method getFileInfo
     * @description Obtiene información de un archivo
     * @param fileId - ID del archivo
     * @returns Promise con la información del archivo o null si no existe
     */
    async getFileInfo(fileId: string): Promise<MediaFile | null> {
        try {
            const { publicId } = this.parseFileId(fileId);
            const resourceType = this.determineResourceType(fileId);

            const result = await cloudinary.api.resource(publicId, {
                resource_type: resourceType
            });

            return this.createMediaFile(fileId, result);

        } catch (error) {
            // Si el archivo no existe, retornar null
            if (error instanceof Error && error.message.includes('not found')) {
                return null;
            }
            
            console.error(`Error getting file info for ${fileId}:`, error);
            throw new Error(`Failed to get file info for ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method listFiles
     * @description Lista archivos en una carpeta
     * @param folderPath - Ruta de la carpeta
     * @param options - Opciones de listado
     * @returns Promise con la lista de archivos
     */
    async listFiles(folderPath: string, options: ListFilesOptions = {}): Promise<MediaFile[]> {
        try {
            const result = await cloudinary.api.resources({
                type: 'private',
                prefix: folderPath,
                max_results: options.maxResults || 100,
                resource_type: options.resourceType
            });

            return result.resources.map((resource: any) => 
                this.createMediaFile(this.buildFileId(resource.public_id), resource)
            );

        } catch (error) {
            console.error(`Error listing files in ${folderPath}:`, error);
            throw new Error(`Failed to list files in ${folderPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @method fileExists
     * @description Verifica si un archivo existe
     * @param fileId - ID del archivo
     * @returns Promise que se resuelve a true si existe, false en caso contrario
     */
    async fileExists(fileId: string): Promise<boolean> {
        const fileInfo = await this.getFileInfo(fileId);
        return fileInfo !== null;
    }

    /**
     * @method getUsageStats
     * @description Obtiene estadísticas de uso
     * @param options - Opciones para las estadísticas
     * @returns Promise con las estadísticas de uso
     */
    async getUsageStats(options: UsageStatsOptions = {}): Promise<UsageStats> {
        try {
            const prefix = options.folder || '';
            
            const result = await cloudinary.api.resources({
                type: 'private',
                prefix: prefix,
                max_results: 1000
            });

            const files = result.resources;
            const totalFiles = files.length;
            const totalSize = files.reduce((sum: number, file: any) => sum + (file.bytes || 0), 0);

            // Agrupar por tipo de archivo
            const fileTypes = {
                images: files.filter((f: any) => f.resource_type === 'image').length,
                documents: files.filter((f: any) => f.resource_type === 'raw').length,
                videos: files.filter((f: any) => f.resource_type === 'video').length
            };

            // Estimación de ancho de banda (simplificada)
            const bandwidth = await this.estimateBandwidth(prefix, options.timeRange);
            const lastUpload = files.length > 0 
                ? new Date(Math.max(...files.map((f: any) => new Date(f.created_at).getTime())))
                : new Date();

            return {
                totalFiles,
                totalSize,
                fileTypes,
                bandwidth,
                lastUpload
            };

        } catch (error) {
            console.error('Error getting usage stats:', error);
            throw new Error(`Failed to get usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * @private
     * @method parseFileId
     * @description Parsea un fileId para extraer publicId y folder
     * @param fileId - ID del archivo (ej: "users/123/photo.jpg")
     * @returns Objeto con publicId y folder
     */
    private parseFileId(fileId: string): { publicId: string; folder?: string } {
        const parts = fileId.split('/');
        
        if (parts.length === 1) {
            // Archivo en root: "photo.jpg" -> publicId: "photo", folder: undefined
            const nameWithoutExt = parts[0].replace(/\.[^/.]+$/, '');
            return { publicId: nameWithoutExt };
        } else {
            // Archivo en carpeta: "users/123/photo.jpg" -> publicId: "users/123/photo", folder: "users/123"
            const fileName = parts[parts.length - 1];
            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
            const folder = parts.slice(0, -1).join('/');
            
            return { 
                publicId: `${folder}/${nameWithoutExt}`, // Incluir la carpeta en el publicId
                folder: folder
            };
        }
    }

    /**
     * @private
     * @method buildFileId
     * @description Construye un fileId a partir del publicId de Cloudinary
     * @param publicId - Public ID de Cloudinary
     * @returns FileId en formato estándar
     */
    private buildFileId(publicId: string): string {
        // Cloudinary publicId puede incluir folder, convertirlo a nuestro formato
        return publicId.replace(/^[^/]+\//, ''); // Remover cloud_name si está presente
    }

    /**
     * @private
     * @method determineResourceType
     * @description Determina el tipo de recurso basado en la extensión del archivo
     * @param fileId - ID del archivo
     * @returns Tipo de recurso
     */
    private determineResourceType(fileId: string): 'image' | 'raw' | 'video' {
        const extension = fileId.split('.').pop()?.toLowerCase();
        
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'pdf']; // PDFs como image por defecto
        const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
        
        if (imageExtensions.includes(extension || '')) {
            return 'image';
        } else if (videoExtensions.includes(extension || '')) {
            return 'video';
        } else {
            return 'raw';
        }
    }

    /**
     * @private
     * @method uploadToCloudinary
     * @description Sube un archivo a Cloudinary usando upload_stream
     * @param buffer - Contenido del archivo
     * @param options - Opciones de subida
     * @returns Promise con el resultado de la subida
     */
    private uploadToCloudinary(buffer: Buffer, options: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                options,
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            
            uploadStream.end(buffer);
        });
    }

    /**
     * @private
     * @method createMediaFile
     * @description Crea un objeto MediaFile a partir del resultado de Cloudinary
     * @param fileId - ID del archivo
     * @param result - Resultado de Cloudinary
     * @returns Objeto MediaFile
     */
    private createMediaFile(fileId: string, result: any): MediaFile {
        return {
            id: fileId,
            publicId: result.public_id,
            url: this.generateSignedUrl(result.public_id, result.resource_type),
            size: result.bytes || 0,
            format: result.format || 'unknown',
            resourceType: result.resource_type as 'image' | 'raw' | 'video',
            createdAt: new Date(result.created_at),
            updatedAt: result.last_updated ? new Date(result.last_updated) : undefined,
            metadata: result.context || {}
        };
    }

    /**
     * @private
     * @method generateSignedUrl
     * @description Genera una URL firmada para un archivo
     * @param publicId - Public ID del archivo
     * @param resourceType - Tipo de recurso
     * @returns URL firmada
     */
    private generateSignedUrl(publicId: string, resourceType: string): string {
        return cloudinary.url(publicId, {
            resource_type: resourceType as 'image' | 'raw' | 'video',
            type: 'private',
            sign_url: true,
            secure: true,
            expires_at: Math.round(Date.now() / 1000) + 3600
        });
    }

    /**
     * @private
     * @method estimateBandwidth
     * @description Estima el uso de ancho de banda
     * @param prefix - Prefijo para buscar archivos
     * @param timeRange - Rango de tiempo
     * @returns Estimación del ancho de banda en bytes
     */
    private async estimateBandwidth(prefix: string, timeRange?: string): Promise<number> {
        // Esta es una estimación simplificada
        // En una implementación real, podrías usar Cloudinary Analytics API
        const result = await cloudinary.api.resources({
            type: 'private',
            prefix: prefix,
            max_results: 1000
        });

        return result.resources.reduce((sum: number, file: any) => sum + (file.bytes || 0), 0);
    }
}