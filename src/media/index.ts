import fs from 'fs';
import path from 'path';
import { SaveImageType, SavePdfType } from './index.d';

const ensurePublicDirectoryExists = () => {
    // First ensure the main public directory exists
    if (!fs.existsSync('public')) {
        fs.mkdirSync('public');
    }
};

export const saveImage: SaveImageType = (image: Buffer, path: string) => {
    ensurePublicDirectoryExists();
    fs.writeFileSync(`public/${path}`, image);

    return path;
}

export const savePdf: SavePdfType = (pdf: Buffer, path: string) => {
    ensurePublicDirectoryExists();
    fs.writeFileSync(`public/${path}`, pdf);

    return path;
}