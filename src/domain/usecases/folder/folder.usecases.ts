import { Folder } from "../../entities/Folder";

export const getAllFolders = async (userId: string) => {
    const folders = await Folder.find({ userId });
    return folders;
};

export const getFolderById = async (userId: string, folderId: string) => {
    const folder = await Folder.findOne({ userId, _id: folderId });
    return folder;
};

export const createFolder = async (userId: string) => {
    const folder = await Folder.create({ userId });
    return folder;
};

export const deleteFolder = async (userId: string, folderId: string) => {
    const folder = await Folder.deleteOne({ userId, _id: folderId });
    return folder;
};



