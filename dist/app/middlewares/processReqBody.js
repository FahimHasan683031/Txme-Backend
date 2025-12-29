"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileAndBodyProcessorUsingDiskStorage = void 0;
const multer_1 = __importDefault(require("multer"));
const http_status_codes_1 = require("http-status-codes");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const s3Helper_1 = require("../../helpers/s3Helper");
// ✅ Updated upload fields - messageFiles added
const uploadFields = [
    { name: 'image', maxCount: 1 },
    { name: 'media', maxCount: 3 },
    { name: 'documents', maxCount: 3 },
    { name: 'idDocuments', maxCount: 3 },
    { name: 'addressDocuments', maxCount: 3 },
    { name: 'serviceimage', maxCount: 1 },
    { name: 'messageFiles', maxCount: 4 },
];
const fileAndBodyProcessorUsingDiskStorage = () => {
    const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
    if (!fs_1.default.existsSync(uploadsDir)) {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    }
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const folderPath = path_1.default.join(uploadsDir, file.fieldname);
            if (!fs_1.default.existsSync(folderPath)) {
                fs_1.default.mkdirSync(folderPath, { recursive: true });
            }
            cb(null, folderPath);
        },
        filename: (req, file, cb) => {
            const extension = path_1.default.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
            const filename = `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}${extension}`;
            cb(null, filename);
        },
    });
    const fileFilter = (req, file, cb) => {
        var _a, _b;
        try {
            const allowedTypes = {
                image: ['image/jpeg', 'image/png', 'image/jpg'],
                media: ['video/mp4', 'audio/mpeg'],
                documents: ['application/pdf'],
                idDocuments: [
                    'image/jpeg',
                    'image/png',
                    'image/jpg',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
                addressDocuments: [
                    'image/jpeg',
                    'image/png',
                    'image/jpg',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
                serviceimage: ['image/jpeg', 'image/png', 'image/jpg'],
                messageFiles: [
                    'image/jpeg',
                    'image/png',
                    'image/jpg',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ],
            };
            const fieldType = file.fieldname;
            if (!((_a = allowedTypes[fieldType]) === null || _a === void 0 ? void 0 : _a.includes(file.mimetype))) {
                return cb(new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Invalid file type for ${file.fieldname}. Allowed types: ${(_b = allowedTypes[fieldType]) === null || _b === void 0 ? void 0 : _b.join(', ')}`));
            }
            cb(null, true);
        }
        catch (error) {
            cb(new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'File validation failed'));
        }
    };
    const upload = (0, multer_1.default)({
        storage,
        fileFilter,
        limits: { fileSize: 10 * 1024 * 1024, files: 20 },
    }).fields(uploadFields);
    return (req, res, next) => {
        upload(req, res, async (error) => {
            var _a;
            if (error)
                return next(error);
            try {
                // Parse JSON wrapper
                if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data) {
                    req.body = JSON.parse(req.body.data);
                }
                if (!req.files) {
                    return next();
                }
                const processedFiles = {};
                const fieldsConfig = new Map(uploadFields.map((f) => [f.name, f.maxCount]));
                // Process ALL fields in parallel
                await Promise.all(Object.entries(req.files).map(async ([fieldName, files]) => {
                    var _a;
                    const fileArray = files;
                    const maxCount = (_a = fieldsConfig.get(fieldName)) !== null && _a !== void 0 ? _a : 1;
                    const paths = [];
                    // Optimize ALL images in this field in parallel
                    await Promise.all(fileArray.map(async (file) => {
                        const fullPath = path_1.default.join(uploadsDir, fieldName, file.filename);
                        // Only optimize images (not PDFs or documents)
                        if (['image', 'idDocuments', 'addressDocuments', 'serviceimage', 'messageFiles'].includes(fieldName) &&
                            file.mimetype.startsWith('image/')) {
                            const tempPath = fullPath + '.opt';
                            try {
                                let sharpInstance = (0, sharp_1.default)(fullPath)
                                    .rotate() // fix orientation
                                    .resize(1200, null, { withoutEnlargement: true });
                                if (file.mimetype === 'image/png') {
                                    sharpInstance = sharpInstance.png({ quality: 85 });
                                }
                                else {
                                    sharpInstance = sharpInstance.jpeg({
                                        quality: 85,
                                        mozjpeg: true,
                                    });
                                }
                                await sharpInstance.toFile(tempPath);
                                fs_1.default.unlinkSync(fullPath);
                                fs_1.default.renameSync(tempPath, fullPath);
                            }
                            catch (err) {
                                console.error(`Failed to optimize ${file.filename}:`, err);
                            }
                        }
                        // Upload to S3 and Cleanup local
                        const s3Url = await (0, s3Helper_1.uploadFileToS3)(fullPath, fieldName, file.filename, file.mimetype);
                        paths.push(s3Url);
                    }));
                    processedFiles[fieldName] = maxCount > 1 ? paths : paths[0];
                }));
                console.log("processedFiles", processedFiles);
                // Merge processed files into request body
                req.body = {
                    ...req.body,
                    ...(processedFiles.image && { profilePicture: processedFiles.image }),
                    ...(processedFiles.idDocuments && { idDocuments: processedFiles.idDocuments }),
                    ...(processedFiles.addressDocuments && { addressDocuments: processedFiles.addressDocuments }),
                    ...(processedFiles.documents && { documents: processedFiles.documents }),
                    ...(processedFiles.media && { media: processedFiles.media }),
                    ...(processedFiles.serviceimage && { image: processedFiles.serviceimage }),
                    ...(processedFiles.messageFiles && { files: processedFiles.messageFiles }),
                };
                next();
            }
            catch (err) {
                next(err);
            }
        });
    };
};
exports.fileAndBodyProcessorUsingDiskStorage = fileAndBodyProcessorUsingDiskStorage;
