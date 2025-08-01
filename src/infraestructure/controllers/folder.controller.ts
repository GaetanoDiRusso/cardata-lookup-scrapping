import { Request, Response } from 'express';
import { getAllFolders as getAllFoldersUseCase, getFolderById as getFolderByIdUseCase, createFolder as createFolderUseCase, deleteFolder as deleteFolderUseCase } from '../../domain/usecases/folder/folder.usecases';

/**
 * @controller
 * Get all folders from a user
 */
export const getAllFolders = async (req: Request, res: Response) => {
    const { userId } = req.body;

    const folders = await getAllFoldersUseCase(userId);

    res.send(folders);
};

/**
 * @controller
 * Get a folder by id
 * It should be a folder that belongs to the user
 */
export const getFolderById = async (req: Request, res: Response) => {
    const { userId, folderId } = req.body;

    const folder = await getFolderByIdUseCase(userId, folderId);

    res.send(folder);
};

/**
 * @controller
 * Create a new folder
 */
export const createFolder = async (req: Request, res: Response) => {
    const { userId } = req.body;

    const folder = await createFolderUseCase(userId);

    res.send(folder);
};

/**
 * @controller
 * Delete a folder
 */
export const deleteFolder = async (req: Request, res: Response) => {
    const { userId, folderId } = req.body;

    const folder = await deleteFolderUseCase(userId, folderId);

    res.send(folder);
};