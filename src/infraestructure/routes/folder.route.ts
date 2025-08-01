import { Router } from 'express';
import { getAllFolders, getFolderById, createFolder, deleteFolder } from '../controllers/folder.controller';

const router = Router();

/**
 * @route GET /api/folder/all
 * Get all folders for a user
 */
router.get('/all', getAllFolders);

/**
 * @route GET /api/folder/:folderId
 * Get a folder by id.
 * It should be a folder that belongs to the user.
 */
router.get('/:folderId', getFolderById);

/**
 * @route POST /api/folder/create
 * Create a new folder
 */
router.post('/create', createFolder);

/**
 * @route DELETE /api/folder/:folderId
 * Delete a folder
 */
router.delete('/:folderId', deleteFolder);

export default router;