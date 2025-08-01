export interface VehicleData {
    licensePlate: string,
    registrationNumber: string,
    department: string,
    brand: string,
    model: string,
    year: number,
    type: string,
    cylinders: number,
    fuel: string,
    attribute: string,
    engineCapacity: number,
    totalWeight: number,
    motorNumber: string,
    chassisNumber: string,
    axles: number;
    passengers: number;
    owner: string;
    ownerIdentification: string;
}

export interface VehicleDataPrev {
    licensePlate: string,
    registrationNumber: string,
    brand: string,
    model: string,
    year: number,
}

export class Vehicle {
    constructor(
        readonly id: string,
        readonly vehicleData: VehicleData,
        readonly folderId: string,
        readonly createdAt: Date,
        readonly updatedAt: Date,
    ) {}
}

export class VehiclePrev {
    constructor(
        readonly id: string,
        readonly vehicleDataPrev: VehicleDataPrev,
        readonly folderId: string,
        readonly createdAt: Date,
        readonly updatedAt: Date,
    ) {}
}
