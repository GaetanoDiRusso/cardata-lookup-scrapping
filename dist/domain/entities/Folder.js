"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderPrev = exports.Folder = void 0;
class Folder {
    constructor(id, vehicle, buyer, seller, createdAt, updatedAt) {
        this.id = id;
        this.vehicle = vehicle;
        this.buyer = buyer;
        this.seller = seller;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
exports.Folder = Folder;
class FolderPrev {
    constructor(id, vehiclePrev, buyerPrev, sellerPrev) {
        this.id = id;
        this.vehiclePrev = vehiclePrev;
        this.buyerPrev = buyerPrev;
        this.sellerPrev = sellerPrev;
    }
}
exports.FolderPrev = FolderPrev;
