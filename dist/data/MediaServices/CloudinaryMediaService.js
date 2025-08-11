"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryMediaService = void 0;
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
/**
 * @class CloudinaryMediaService
 * @description Implementación genérica del servicio de media usando Cloudinary
 * @implements IMediaService
 * @author Gaetano Di Russo
 * @version 2.0.0
 */
class CloudinaryMediaService {
    /**
     * @constructor
     * @description Inicializa el servicio de Cloudinary
     * @param options - Opciones de configuración
     * @throws Error si faltan credenciales requeridas
     */
    constructor(options) {
        this.CLOUD_NAME = (options === null || options === void 0 ? void 0 : options.cloudName) || process.env.CLOUDINARY_CLOUD_NAME || '';
        this.API_KEY = (options === null || options === void 0 ? void 0 : options.apiKey) || process.env.CLOUDINARY_API_KEY || '';
        this.API_SECRET = (options === null || options === void 0 ? void 0 : options.apiSecret) || process.env.CLOUDINARY_API_SECRET || '';
        this.DEFAULT_FOLDER = (options === null || options === void 0 ? void 0 : options.defaultFolder) || 'media';
        if (!this.CLOUD_NAME || !this.API_KEY || !this.API_SECRET) {
            throw new Error('Cloudinary credentials are required. Please provide cloudName, apiKey, and apiSecret.');
        }
        // Configurar Cloudinary
        cloudinary_1.v2.config({
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
    uploadFile(fileId_1, buffer_1) {
        return __awaiter(this, arguments, void 0, function* (fileId, buffer, options = {}) {
            try {
                const { publicId, folder } = this.parseFileId(fileId);
                const resourceType = options.resourceType || this.determineResourceType(fileId);
                // Configurar opciones de subida
                const uploadOptions = {
                    public_id: publicId,
                    // No especificar folder si ya está en publicId para evitar duplicación
                    resource_type: resourceType,
                    type: 'upload', // Mantener como 'upload' para URLs correctas
                    access_mode: options.accessMode || 'public', // Volver a 'authenticated'
                    transformation: options.transformation,
                    quality: options.quality,
                    format: options.format,
                    context: options.metadata
                };
                // Subir archivo
                const result = yield this.uploadToCloudinary(buffer, uploadOptions);
                if (!result) {
                    throw new Error(`Failed to upload file ${fileId}`);
                }
                return this.createMediaFile(fileId, result);
            }
            catch (error) {
                console.error(`Error uploading file ${fileId}:`, error);
                throw new Error(`Failed to upload file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * @method uploadFiles
     * @description Sube múltiples archivos al servicio de media
     * @param files - Array de archivos a subir
     * @param options - Opciones de subida
     * @returns Promise con la información de todos los archivos subidos
     */
    uploadFiles(files_1) {
        return __awaiter(this, arguments, void 0, function* (files, options = {}) {
            const uploadPromises = files.map(file => this.uploadFile(file.fileId, file.buffer, Object.assign(Object.assign({}, options), file.options)));
            return Promise.all(uploadPromises);
        });
    }
    /**
     * @method getVideoStream
     * @description Obtiene un stream de video para subir directamente a Cloudinary
     * @param fileId - ID del archivo
     * @param options - Opciones de subida
     * @returns Promise con el stream de video y callback de resultado
     */
    getVideoStream(fileId_1) {
        return __awaiter(this, arguments, void 0, function* (fileId, options = {}) {
            const { publicId, folder } = this.parseFileId(fileId);
            const resourceType = options.resourceType || 'video';
            // Crear PassThrough stream con configuración optimizada
            const pipeStream = new stream_1.PassThrough({
                highWaterMark: 32 * 1024, // 32KB buffer (más pequeño para evitar timeouts)
                allowHalfOpen: false
            });
            // Configurar opciones de subida con timeout
            const uploadOptions = {
                public_id: publicId,
                resource_type: resourceType,
                type: 'upload',
                access_mode: options.accessMode || 'authenticated',
                transformation: options.transformation,
                quality: options.quality,
                format: options.format,
                context: options.metadata,
                timeout: 300000, // 5 minutos de timeout
                chunk_size: 6000000, // 6MB chunks para videos grandes
                eager: [], // Sin transformaciones eager para evitar timeouts
                eager_async: false
            };
            // Crear cloudinaryStream con mejor manejo de errores
            const cloudinaryStream = cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error) {
                    console.error(`Cloudinary upload error for ${fileId}:`, {
                        message: error.message,
                        http_code: error.http_code,
                        name: error.name,
                        fileId,
                        publicId
                    });
                    // Emitir error en el stream
                    pipeStream.emit('error', new Error(`Cloudinary upload failed: ${error.message}`));
                }
                else if (result) {
                    console.log(`Video uploaded successfully: ${fileId}`, {
                        public_id: result.public_id,
                        size: result.bytes,
                        format: result.format
                    });
                }
            });
            // Conectar PassThrough a Cloudinary
            pipeStream.pipe(cloudinaryStream);
            // Manejar errores del stream
            pipeStream.on('error', (error) => {
                console.error(`Stream error for ${fileId}:`, error);
                cloudinaryStream.destroy(error);
            });
            cloudinaryStream.on('error', (error) => {
                console.error(`Cloudinary stream error for ${fileId}:`, error);
                pipeStream.destroy(error);
            });
            // Manejar cuando el stream se cierra
            pipeStream.on('close', () => {
                console.log(`Stream closed for ${fileId}`);
            });
            cloudinaryStream.on('close', () => {
                console.log(`Cloudinary stream closed for ${fileId}`);
            });
            return pipeStream;
        });
    }
    /**
     * @method getSignedUrl
     * @description Obtiene la URL firmada de un archivo
     * @param fileId - ID del archivo
     * @param options - Opciones para generar la URL
     * @returns Promise con la URL firmada
     */
    getSignedUrl(fileId_1) {
        return __awaiter(this, arguments, void 0, function* (fileId, options = {}) {
            try {
                const { publicId } = this.parseFileId(fileId);
                const resourceType = options.resourceType || this.determineResourceType(fileId);
                const expiresIn = options.expiresIn || 86400; // 24 horas por defecto (en lugar de 1 hora)
                const signedUrl = cloudinary_1.v2.url(publicId, {
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
            }
            catch (error) {
                console.error(`Error generating signed URL for ${fileId}:`, error);
                throw new Error(`Failed to generate signed URL for ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * @method regenerateSignedUrl
     * @description Regenera una URL firmada con un nuevo tiempo de expiración
     * @param fileId - ID del archivo
     * @param options - Opciones para generar la URL
     * @returns Promise con la nueva URL firmada
     */
    regenerateSignedUrl(fileId_1) {
        return __awaiter(this, arguments, void 0, function* (fileId, options = {}) {
            try {
                const { publicId } = this.parseFileId(fileId);
                const resourceType = options.resourceType || this.determineResourceType(fileId);
                const expiresIn = options.expiresIn || 86400; // 24 horas por defecto
                return cloudinary_1.v2.url(publicId, {
                    resource_type: resourceType,
                    sign_url: true,
                    secure: true,
                    expires_at: Math.round(Date.now() / 1000) + expiresIn,
                    transformation: options.transformation,
                    format: options.format,
                    quality: options.quality,
                    fetch_format: 'auto'
                });
            }
            catch (error) {
                console.error(`Error regenerating signed URL for ${fileId}:`, error);
                throw new Error(`Failed to regenerate signed URL for ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * @method validateSignedUrl
     * @description Valida si una URL firmada sigue siendo válida
     * @param url - URL firmada a validar
     * @returns Promise que se resuelve a true si es válida, false en caso contrario
     */
    validateSignedUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(url, { method: 'HEAD' });
                return response.ok;
            }
            catch (error) {
                console.error('Error validating signed URL:', error);
                return false;
            }
        });
    }
    /**
     * @method deleteFile
     * @description Elimina un archivo del servicio de media
     * @param fileId - ID del archivo a eliminar
     * @returns Promise que se resuelve cuando se elimina el archivo
     */
    deleteFile(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { publicId } = this.parseFileId(fileId);
                const resourceType = this.determineResourceType(fileId);
                yield cloudinary_1.v2.uploader.destroy(publicId, {
                    resource_type: resourceType
                });
                console.log(`File ${fileId} deleted successfully`);
            }
            catch (error) {
                console.error(`Error deleting file ${fileId}:`, error);
                throw new Error(`Failed to delete file ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * @method deleteFiles
     * @description Elimina múltiples archivos del servicio de media
     * @param fileIds - Array de IDs de archivos a eliminar
     * @returns Promise que se resuelve cuando se eliminan todos los archivos
     */
    deleteFiles(fileIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const deletePromises = fileIds.map(fileId => this.deleteFile(fileId));
            yield Promise.all(deletePromises);
        });
    }
    /**
     * @method deleteFolder
     * @description Elimina todos los archivos de una carpeta
     * @param folderPath - Ruta de la carpeta (ej: "users/123/")
     * @returns Promise que se resuelve cuando se eliminan todos los archivos
     */
    deleteFolder(folderPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Listar todos los archivos en la carpeta
                const files = yield this.listFiles(folderPath, { maxResults: 1000 });
                // Eliminar todos los archivos
                const deletePromises = files.map(file => this.deleteFile(file.id));
                yield Promise.all(deletePromises);
                console.log(`Folder ${folderPath} deleted successfully`);
            }
            catch (error) {
                console.error(`Error deleting folder ${folderPath}:`, error);
                throw new Error(`Failed to delete folder ${folderPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * @method getFileInfo
     * @description Obtiene información de un archivo
     * @param fileId - ID del archivo
     * @returns Promise con la información del archivo o null si no existe
     */
    getFileInfo(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { publicId } = this.parseFileId(fileId);
                const resourceType = this.determineResourceType(fileId);
                const result = yield cloudinary_1.v2.api.resource(publicId, {
                    resource_type: resourceType
                });
                return this.createMediaFile(fileId, result);
            }
            catch (error) {
                // Si el archivo no existe, retornar null
                if (error instanceof Error && error.message.includes('not found')) {
                    return null;
                }
                console.error(`Error getting file info for ${fileId}:`, error);
                throw new Error(`Failed to get file info for ${fileId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * @method listFiles
     * @description Lista archivos en una carpeta
     * @param folderPath - Ruta de la carpeta
     * @param options - Opciones de listado
     * @returns Promise con la lista de archivos
     */
    listFiles(folderPath_1) {
        return __awaiter(this, arguments, void 0, function* (folderPath, options = {}) {
            try {
                const result = yield cloudinary_1.v2.api.resources({
                    type: 'private',
                    prefix: folderPath,
                    max_results: options.maxResults || 100,
                    resource_type: options.resourceType
                });
                return result.resources.map((resource) => this.createMediaFile(this.buildFileId(resource.public_id), resource));
            }
            catch (error) {
                console.error(`Error listing files in ${folderPath}:`, error);
                throw new Error(`Failed to list files in ${folderPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * @method fileExists
     * @description Verifica si un archivo existe
     * @param fileId - ID del archivo
     * @returns Promise que se resuelve a true si existe, false en caso contrario
     */
    fileExists(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileInfo = yield this.getFileInfo(fileId);
            return fileInfo !== null;
        });
    }
    /**
     * @method getUsageStats
     * @description Obtiene estadísticas de uso
     * @param options - Opciones para las estadísticas
     * @returns Promise con las estadísticas de uso
     */
    getUsageStats() {
        return __awaiter(this, arguments, void 0, function* (options = {}) {
            try {
                const prefix = options.folder || '';
                const result = yield cloudinary_1.v2.api.resources({
                    type: 'private',
                    prefix: prefix,
                    max_results: 1000
                });
                const files = result.resources;
                const totalFiles = files.length;
                const totalSize = files.reduce((sum, file) => sum + (file.bytes || 0), 0);
                // Agrupar por tipo de archivo
                const fileTypes = {
                    images: files.filter((f) => f.resource_type === 'image').length,
                    documents: files.filter((f) => f.resource_type === 'raw').length,
                    videos: files.filter((f) => f.resource_type === 'video').length
                };
                // Estimación de ancho de banda (simplificada)
                const bandwidth = yield this.estimateBandwidth(prefix, options.timeRange);
                const lastUpload = files.length > 0
                    ? new Date(Math.max(...files.map((f) => new Date(f.created_at).getTime())))
                    : new Date();
                return {
                    totalFiles,
                    totalSize,
                    fileTypes,
                    bandwidth,
                    lastUpload
                };
            }
            catch (error) {
                console.error('Error getting usage stats:', error);
                throw new Error(`Failed to get usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * @private
     * @method parseFileId
     * @description Parsea un fileId para extraer publicId y folder
     * @param fileId - ID del archivo (ej: "users/123/photo.jpg")
     * @returns Objeto con publicId y folder
     */
    parseFileId(fileId) {
        const parts = fileId.split('/');
        if (parts.length === 1) {
            // Archivo en root: "photo.jpg" -> publicId: "photo", folder: undefined
            const nameWithoutExt = parts[0].replace(/\.[^/.]+$/, '');
            return { publicId: nameWithoutExt };
        }
        else {
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
    buildFileId(publicId) {
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
    determineResourceType(fileId) {
        var _a;
        const extension = (_a = fileId.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'pdf']; // PDFs como image por defecto
        const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
        if (imageExtensions.includes(extension || '')) {
            return 'image';
        }
        else if (videoExtensions.includes(extension || '')) {
            return 'video';
        }
        else {
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
    uploadToCloudinary(buffer, options) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream(options, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
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
    createMediaFile(fileId, result) {
        return {
            id: fileId,
            publicId: result.public_id,
            // url: this.generateSignedUrl(result.public_id, result.resource_type),
            url: result.secure_url,
            size: result.bytes || 0,
            format: result.format || 'unknown',
            resourceType: result.resource_type,
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
    generateSignedUrl(publicId, resourceType) {
        return cloudinary_1.v2.url(publicId, {
            resource_type: resourceType,
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
    estimateBandwidth(prefix, timeRange) {
        return __awaiter(this, void 0, void 0, function* () {
            // Esta es una estimación simplificada
            // En una implementación real, podrías usar Cloudinary Analytics API
            const result = yield cloudinary_1.v2.api.resources({
                type: 'private',
                prefix: prefix,
                max_results: 1000
            });
            return result.resources.reduce((sum, file) => sum + (file.bytes || 0), 0);
        });
    }
}
exports.CloudinaryMediaService = CloudinaryMediaService;
