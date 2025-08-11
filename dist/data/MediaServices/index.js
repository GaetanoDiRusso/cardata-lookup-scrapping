"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryMediaService = exports.mediaService = void 0;
const CloudinaryMediaService_1 = require("./CloudinaryMediaService");
/**
 * @description Instancia del servicio de media configurada para Cloudinary
 * Esta instancia se puede reemplazar fácilmente por otra implementación
 */
exports.mediaService = new CloudinaryMediaService_1.CloudinaryMediaService();
var CloudinaryMediaService_2 = require("./CloudinaryMediaService");
Object.defineProperty(exports, "CloudinaryMediaService", { enumerable: true, get: function () { return CloudinaryMediaService_2.CloudinaryMediaService; } });
