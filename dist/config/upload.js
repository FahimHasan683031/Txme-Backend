"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const index_1 = __importDefault(require("./index"));
cloudinary_1.v2.config({
    cloud_name: index_1.default.cloudinary.cloud_name,
    api_key: index_1.default.cloudinary.api_key,
    api_secret: index_1.default.cloudinary.api_secret,
});
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: (_req, _file) => ({
        folder: 'outfit_orbit',
        resource_type: 'auto'
    })
});
exports.upload = (0, multer_1.default)({ storage });
