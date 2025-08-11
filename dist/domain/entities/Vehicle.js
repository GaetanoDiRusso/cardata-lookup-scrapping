"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehiclePrev = exports.Vehicle = void 0;
class Vehicle {
    constructor(id, vehicleData, folderId, createdAt, updatedAt) {
        this.id = id;
        this.vehicleData = vehicleData;
        this.folderId = folderId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.Vehicle = Vehicle;
class VehiclePrev {
    constructor(id, vehicleDataPrev, folderId, createdAt, updatedAt) {
        this.id = id;
        this.vehicleDataPrev = vehicleDataPrev;
        this.folderId = folderId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.VehiclePrev = VehiclePrev;
