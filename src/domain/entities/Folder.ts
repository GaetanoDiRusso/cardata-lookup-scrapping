import { Person, PersonPrev } from "./Person";
import { Vehicle, VehiclePrev } from "./Vehicle";

export class Folder {
    constructor(
        readonly id: string,
        readonly vehicle: Vehicle,
        readonly buyer: Person,
        readonly seller: Person,
        readonly createdAt: Date,
        readonly updatedAt: Date,
    ) {}
}

export class FolderPrev {
    constructor(
        readonly id: string,
        readonly vehiclePrev: VehiclePrev,
        readonly buyerPrev: PersonPrev,
        readonly sellerPrev: PersonPrev,
    ) {}
}
