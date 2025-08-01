/**
 * @interface IMediaService
 * @description Interfaz genérica para el servicio de manejo de archivos multimedia
 * @author Gaetano Di Russo
 * @version 2.0.0
 */
export interface IMediaService {
    /**
     * Sube un archivo al servicio de media
     * @param fileId - ID único del archivo (puede incluir carpetas: "users/123/photo.jpg")
     * @param buffer - Contenido del archivo
     * @param options - Opciones de subida
     * @returns Promise con la información del archivo subido
     */
    uploadFile(fileId: string, buffer: Buffer, options?: UploadOptions): Promise<MediaFile>;

    /**
     * Sube múltiples archivos al servicio de media
     * @param files - Array de archivos a subir
     * @param options - Opciones de subida
     * @returns Promise con la información de todos los archivos subidos
     */
    uploadFiles(files: FileUpload[], options?: UploadOptions): Promise<MediaFile[]>;

    /**
     * Obtiene la URL firmada de un archivo
     * @param fileId - ID del archivo
     * @param options - Opciones para generar la URL
     * @returns Promise con la URL firmada
     */
    getSignedUrl(fileId: string, options?: SignedUrlOptions): Promise<string>;

    /**
     * Elimina un archivo del servicio de media
     * @param fileId - ID del archivo a eliminar
     * @returns Promise que se resuelve cuando se elimina el archivo
     */
    deleteFile(fileId: string): Promise<void>;

    /**
     * Elimina múltiples archivos del servicio de media
     * @param fileIds - Array de IDs de archivos a eliminar
     * @returns Promise que se resuelve cuando se eliminan todos los archivos
     */
    deleteFiles(fileIds: string[]): Promise<void>;

    /**
     * Elimina todos los archivos de una carpeta
     * @param folderPath - Ruta de la carpeta (ej: "users/123/")
     * @returns Promise que se resuelve cuando se eliminan todos los archivos
     */
    deleteFolder(folderPath: string): Promise<void>;

    /**
     * Obtiene información de un archivo
     * @param fileId - ID del archivo
     * @returns Promise con la información del archivo o null si no existe
     */
    getFileInfo(fileId: string): Promise<MediaFile | null>;

    /**
     * Lista archivos en una carpeta
     * @param folderPath - Ruta de la carpeta
     * @param options - Opciones de listado
     * @returns Promise con la lista de archivos
     */
    listFiles(folderPath: string, options?: ListFilesOptions): Promise<MediaFile[]>;

    /**
     * Verifica si un archivo existe
     * @param fileId - ID del archivo
     * @returns Promise que se resuelve a true si existe, false en caso contrario
     */
    fileExists(fileId: string): Promise<boolean>;

    /**
     * Obtiene estadísticas de uso
     * @param options - Opciones para las estadísticas
     * @returns Promise con las estadísticas de uso
     */
    getUsageStats(options?: UsageStatsOptions): Promise<UsageStats>;

    /**
     * Regenera una URL firmada con un nuevo tiempo de expiración
     * @param fileId - ID del archivo
     * @param options - Opciones para generar la URL
     * @returns Promise con la nueva URL firmada
     */
    regenerateSignedUrl(fileId: string, options?: SignedUrlOptions): Promise<string>;

    /**
     * Valida si una URL firmada sigue siendo válida
     * @param url - URL firmada a validar
     * @returns Promise que se resuelve a true si es válida, false en caso contrario
     */
    validateSignedUrl(url: string): Promise<boolean>;
}

/**
 * @interface MediaFile
 * @description Información de un archivo multimedia
 */
export interface MediaFile {
    id: string;
    publicId: string;
    url: string;
    size: number;
    format: string;
    resourceType: 'image' | 'raw' | 'video';
    createdAt: Date;
    updatedAt?: Date;
    metadata?: Record<string, any>;
}

/**
 * @interface FileUpload
 * @description Información para subir un archivo
 */
export interface FileUpload {
    fileId: string;
    buffer: Buffer;
    options?: UploadOptions;
}

/**
 * @interface UploadOptions
 * @description Opciones para subir archivos
 */
export interface UploadOptions {
    resourceType?: 'image' | 'raw' | 'video';
    accessMode?: 'public' | 'private' | 'authenticated';
    transformation?: any[];
    quality?: 'auto' | number;
    format?: 'auto' | string;
    metadata?: Record<string, any>;
    folder?: string; // Deprecated: usar fileId con rutas
}

/**
 * @interface SignedUrlOptions
 * @description Opciones para generar URLs firmadas
 */
export interface SignedUrlOptions {
    expiresIn?: number; // segundos
    transformation?: any[];
    format?: string;
    quality?: 'auto' | number;
    resourceType?: 'image' | 'raw' | 'video'; // Tipo de recurso para la URL
}

/**
 * @interface ListFilesOptions
 * @description Opciones para listar archivos
 */
export interface ListFilesOptions {
    maxResults?: number;
    resourceType?: 'image' | 'raw' | 'video';
    prefix?: string;
}

/**
 * @interface UsageStats
 * @description Estadísticas de uso del servicio
 */
export interface UsageStats {
    totalFiles: number;
    totalSize: number; // bytes
    bandwidth: number; // bytes
    fileTypes: {
        images: number;
        documents: number;
        videos: number;
    };
    lastUpload: Date;
}

/**
 * @interface UsageStatsOptions
 * @description Opciones para obtener estadísticas
 */
export interface UsageStatsOptions {
    timeRange?: 'day' | 'week' | 'month' | 'year';
    folder?: string;
} 