import { Folder, FolderPrev } from "../entities/Folder";
import { Person } from "../entities/Person";
import { Vehicle } from "../entities/Vehicle";

export interface ICreateFolderData {
    vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>;
    buyer?: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>; // Made optional
    seller?: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>; // Made optional
}

export interface IFolderRepository {
    /**
     * Find all folders by user id
     * @param userId - The id of the user
     * @returns An array of folders
     */
    findAllPrevByUserId(userId: string): Promise<FolderPrev[]>;

    /**
     * Find a folder by id
     * @param folderId - The id of the folder
     * @returns The folder or null if it doesn't exist
     */
    findByFolderId(folderId: string): Promise<Folder | null>;

    /**
     * Create a new folder.
     * Also creates the vehicle, buyer and seller.
     * @param folder - The folder to create
     * @returns The created folder
     */
    create(folder: ICreateFolderData): Promise<Folder>;

    /**
     * Delete a folder by id
     * The folder, vehicle, buyer and seller are NOT deleted.
     * @param folderId - The id of the folder
     */
    delete(folderId: string): Promise<void>;
}