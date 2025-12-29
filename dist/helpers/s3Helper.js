"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToS3 = void 0;
const fs_1 = __importDefault(require("fs"));
const s3_util_1 = require("../util/s3.util");
/**
 * Uploads a local file to S3 and then deletes it from local storage.
 * @param localPath - The absolute path to the local file.
 * @param folderName - The folder/prefix in S3 (e.g., 'image', 'media').
 * @param fileName - The original filename or a generated one.
 * @param mimeType - The mimetype of the file.
 * @returns The public S3 URL.
 */
const uploadFileToS3 = async (localPath, folderName, fileName, mimeType) => {
    try {
        const s3Key = `${folderName}/${Date.now()}-${fileName}`;
        const s3Url = await (0, s3_util_1.uploadToS3)(localPath, s3Key, mimeType);
        // Cleanup local file after successful upload
        if (fs_1.default.existsSync(localPath)) {
            fs_1.default.unlinkSync(localPath);
        }
        return s3Url;
    }
    catch (error) {
        // Still try to cleanup even if upload fails to avoid local storage build-up
        if (fs_1.default.existsSync(localPath)) {
            try {
                fs_1.default.unlinkSync(localPath);
            }
            catch (cleanupError) {
                console.error("Local cleanup failed after S3 error:", cleanupError);
            }
        }
        throw error;
    }
};
exports.uploadFileToS3 = uploadFileToS3;
