"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const http_status_codes_1 = require("http-status-codes");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const ApiErrors_1 = __importDefault(require("../../errors/ApiErrors"));
const s3Helper_1 = require("../../helpers/s3Helper");
const fileUploadHandler = () => {
    //create upload folder
    const baseUploadDir = path_1.default.join(process.cwd(), 'uploads');
    if (!fs_1.default.existsSync(baseUploadDir)) {
        fs_1.default.mkdirSync(baseUploadDir);
    }
    //folder create for different file
    const createDir = (dirPath) => {
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath);
        }
    };
    //create filename
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            let uploadDir;
            switch (file.fieldname) {
                case 'image':
                    uploadDir = path_1.default.join(baseUploadDir, 'image');
                    break;
                case 'media':
                    uploadDir = path_1.default.join(baseUploadDir, 'media');
                    break;
                default:
                    throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'File is not supported');
            }
            createDir(uploadDir);
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const fileExt = path_1.default.extname(file.originalname);
            const fileName = file.originalname
                .replace(fileExt, '')
                .toLowerCase()
                .split(' ')
                .join('-') +
                '-' +
                Date.now();
            cb(null, fileName + fileExt);
        },
    });
    //file filter
    const filterFilter = (req, file, cb) => {
        // console.log("file handler",file)
        if (file.fieldname === 'image') {
            if (file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg') {
                cb(null, true);
            }
            else {
                cb(new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .jpeg, .png, .jpg file supported'));
            }
        }
        else if (file.fieldname === 'media') {
            if (file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg') {
                cb(null, true);
            }
            else {
                cb(new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .png file supported'));
            }
        }
        else {
            cb(new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This file is not supported'));
        }
    };
    const upload = (0, multer_1.default)({ storage: storage, fileFilter: filterFilter })
        .fields([
        { name: 'image', maxCount: 3 },
        { name: 'media', maxCount: 2 },
    ]);
    return (req, res, next) => {
        upload(req, res, async (err) => {
            var _a;
            if (err)
                return next(err);
            // Parse JSON wrapper for mobile applications
            if ((_a = req.body) === null || _a === void 0 ? void 0 : _a.data) {
                try {
                    req.body = JSON.parse(req.body.data);
                }
                catch (e) {
                    console.error("Failed to parse req.body.data:", e);
                }
            }
            if (req.files) {
                const files = req.files;
                try {
                    for (const fieldname in files) {
                        for (const file of files[fieldname]) {
                            const s3Url = await (0, s3Helper_1.uploadFileToS3)(file.path, fieldname, file.filename, file.mimetype);
                            // Update file path to S3 URL for consistent downstream usage
                            file.path = s3Url;
                        }
                    }
                }
                catch (error) {
                    return next(error);
                }
            }
            next();
        });
    };
};
exports.default = fileUploadHandler;
