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
exports.deleteFolder = exports.createFolder = exports.getFolderById = exports.getAllFolders = void 0;
const folder_usecases_1 = require("../../domain/usecases/folder/folder.usecases");
/**
 * @controller
 * Get all folders from a user
 */
const getAllFolders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    const folders = yield (0, folder_usecases_1.getAllFolders)(userId);
    res.send(folders);
});
exports.getAllFolders = getAllFolders;
/**
 * @controller
 * Get a folder by id
 * It should be a folder that belongs to the user
 */
const getFolderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, folderId } = req.body;
    const folder = yield (0, folder_usecases_1.getFolderById)(userId, folderId);
    res.send(folder);
});
exports.getFolderById = getFolderById;
/**
 * @controller
 * Create a new folder
 */
const createFolder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    const folder = yield (0, folder_usecases_1.createFolder)(userId);
    res.send(folder);
});
exports.createFolder = createFolder;
/**
 * @controller
 * Delete a folder
 */
const deleteFolder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, folderId } = req.body;
    const folder = yield (0, folder_usecases_1.deleteFolder)(userId, folderId);
    res.send(folder);
});
exports.deleteFolder = deleteFolder;
