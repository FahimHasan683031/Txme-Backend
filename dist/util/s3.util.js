"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromS3 = exports.uploadToS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const s3Client = new client_s3_1.S3Client({
    region: config_1.default.aws.region || "us-east-1",
    credentials: {
        accessKeyId: config_1.default.aws.accessKeyId,
        secretAccessKey: config_1.default.aws.secretAccessKey,
    },
});
/**
 * Upload a file to S3
 * @param filePath Local path of the file
 * @param fileName Desired name in S3
 * @param mimeType Mime type of the file
 * @returns S3 URL
 */
const uploadToS3 = async (filePath, fileName, mimeType) => {
    if (!config_1.default.aws.bucket) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "S3 Bucket name is missing in config");
    }
    const fileStream = fs_1.default.createReadStream(filePath);
    try {
        const upload = new lib_storage_1.Upload({
            client: s3Client,
            params: {
                Bucket: config_1.default.aws.bucket,
                Key: fileName,
                Body: fileStream,
                ContentType: mimeType,
                // ACL: "public-read", // Uncomment if your bucket supports public ACLs
            },
        });
        await upload.done();
        // Return the public URL
        return `https://${config_1.default.aws.bucket}.s3.${config_1.default.aws.region}.amazonaws.com/${fileName}`;
    }
    catch (error) {
        console.error("❌ S3 Upload Error:", error.message || error);
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to upload to S3: ${error.message}`);
    }
    finally {
        fileStream.destroy();
    }
};
exports.uploadToS3 = uploadToS3;
/**
 * Delete a file from S3
 * @param key S3 Key (file name/path)
 */
const deleteFromS3 = async (key) => {
    try {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: config_1.default.aws.bucket,
            Key: key,
        });
        await s3Client.send(command);
    }
    catch (error) {
        console.error("❌ S3 Delete Error:", error.message || error);
    }
};
exports.deleteFromS3 = deleteFromS3;
