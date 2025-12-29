import { Request } from 'express';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import ApiError from '../../errors/ApiErrors';
import { uploadFileToS3 } from '../../helpers/s3Helper';

const fileUploadHandler = () => {

    //create upload folder
    const baseUploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(baseUploadDir)) {
        fs.mkdirSync(baseUploadDir);
    }

    //folder create for different file
    const createDir = (dirPath: string) => {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath);
        }
    };

    //create filename
    const storage = multer.diskStorage({

        destination: (req, file, cb) => {
            let uploadDir;
            switch (file.fieldname) {
                case 'image':
                    uploadDir = path.join(baseUploadDir, 'image');
                    break;
                case 'media':
                    uploadDir = path.join(baseUploadDir, 'media');
                    break;
                default:
                    throw new ApiError(StatusCodes.BAD_REQUEST, 'File is not supported');
            }
            createDir(uploadDir);
            cb(null, uploadDir);
        },

        filename: (req, file, cb) => {
            const fileExt = path.extname(file.originalname);
            const fileName =
                file.originalname
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
    const filterFilter = (req: Request, file: any, cb: FileFilterCallback) => {

        // console.log("file handler",file)
        if (file.fieldname === 'image') {
            if (
                file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg'
            ) {
                cb(null, true);
            } else {
                cb(new ApiError(StatusCodes.BAD_REQUEST, 'Only .jpeg, .png, .jpg file supported'))
            }
        } else if (file.fieldname === 'media') {
            if (
                file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpg'
            ) {
                cb(null, true);
            } else {
                cb(new ApiError(StatusCodes.BAD_REQUEST, 'Only .png file supported'))
            }
        }

        else {
            cb(new ApiError(StatusCodes.BAD_REQUEST, 'This file is not supported'))
        }
    };

    const upload = multer({ storage: storage, fileFilter: filterFilter })
        .fields([
            { name: 'image', maxCount: 3 },
            { name: 'media', maxCount: 2 },
        ]);

    return (req: Request, res: any, next: any) => {
        upload(req, res, async (err) => {
            if (err) return next(err);

            // Parse JSON wrapper for mobile applications
            if (req.body?.data) {
                try {
                    req.body = JSON.parse(req.body.data);
                } catch (e) {
                    console.error("Failed to parse req.body.data:", e);
                }
            }

            if (req.files) {
                const files = req.files as { [fieldname: string]: Express.Multer.File[] };
                try {
                    for (const fieldname in files) {
                        for (const file of files[fieldname]) {
                            const s3Url = await uploadFileToS3(
                                file.path,
                                fieldname,
                                file.filename,
                                file.mimetype
                            );

                            // Update file path to S3 URL for consistent downstream usage
                            file.path = s3Url;
                        }
                    }
                } catch (error) {
                    return next(error);
                }
            }
            next();
        });
    };

};

export default fileUploadHandler;