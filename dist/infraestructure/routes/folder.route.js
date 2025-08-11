"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const folder_controller_1 = require("../controllers/folder.controller");
const router = (0, express_1.Router)();
/**
 * @route GET /api/folder/all
 * Get all folders for a user
 */
router.get('/all', folder_controller_1.getAllFolders);
/**
 * @route GET /api/folder/:folderId
 * Get a folder by id.
 * It should be a folder that belongs to the user.
 */
router.get('/:folderId', folder_controller_1.getFolderById);
/**
 * @route POST /api/folder/create
 * Create a new folder
 */
router.post('/create', folder_controller_1.createFolder);
/**
 * @route DELETE /api/folder/:folderId
 * Delete a folder
 */
router.delete('/:folderId', folder_controller_1.deleteFolder);
exports.default = router;
