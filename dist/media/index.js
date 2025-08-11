"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePdf = exports.saveImage = void 0;
const fs_1 = __importDefault(require("fs"));
const ensurePublicDirectoryExists = () => {
    // First ensure the main public directory exists
    if (!fs_1.default.existsSync('public')) {
        fs_1.default.mkdirSync('public');
    }
};
const saveImage = (image, path) => {
    ensurePublicDirectoryExists();
    fs_1.default.writeFileSync(`public/${path}`, image);
    return path;
};
exports.saveImage = saveImage;
const savePdf = (pdf, path) => {
    ensurePublicDirectoryExists();
    fs_1.default.writeFileSync(`public/${path}`, pdf);
    return path;
};
exports.savePdf = savePdf;
