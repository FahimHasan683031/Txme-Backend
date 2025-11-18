import { Request, Response, NextFunction } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { StatusCodes } from 'http-status-codes'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import ApiError from '../../errors/ApiErrors'

type IFolderName =
  | 'image'
  | 'media'
  | 'documents'
  | 'idDocuments'
  | 'addressDocuments'
  | 'serviceimage' 

interface ProcessedFiles {
  [key: string]: string | string[] | undefined
}

// ✅ Updated upload fields - serviceimage added
const uploadFields = [
  { name: 'image', maxCount: 1 },
  { name: 'media', maxCount: 3 },
  { name: 'documents', maxCount: 3 },
  { name: 'idDocuments', maxCount: 3 },
  { name: 'addressDocuments', maxCount: 3 },
  { name: 'serviceimage', maxCount: 1 }, // 
] as const

export const fileAndBodyProcessorUsingDiskStorage = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folderPath = path.join(uploadsDir, file.fieldname);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      cb(null, folderPath);
    },
    filename: (req, file, cb) => {
      const extension =
        path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
      const filename = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}${extension}`;
      cb(null, filename);
    },
  });

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
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
      };

      const fieldType = file.fieldname as IFolderName;
      if (!allowedTypes[fieldType]?.includes(file.mimetype)) {
        return cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            `Invalid file type for ${file.fieldname}. Allowed types: ${allowedTypes[fieldType]?.join(', ')}`
          ),
        );
      }
      cb(null, true);
    } catch (error) {
      cb(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'File validation failed',
        ),
      );
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024, files: 20 },
  }).fields(uploadFields);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (error) => {
      if (error) return next(error);

      try {
        // Parse JSON wrapper
        if (req.body?.data) {
          req.body = JSON.parse(req.body.data);
        }

        if (!req.files) {
          return next();
        }

        const processedFiles: ProcessedFiles = {};
        const fieldsConfig = new Map(
          uploadFields.map((f) => [f.name, f.maxCount]),
        );

        // Process ALL fields in parallel
        await Promise.all(
          Object.entries(req.files).map(async ([fieldName, files]) => {
            const fileArray = files as Express.Multer.File[];
            const maxCount = fieldsConfig.get(fieldName as IFolderName) ?? 1;
            const paths: string[] = [];

            // Optimize ALL images in this field in parallel
            await Promise.all(
              fileArray.map(async (file) => {
                const filePath = `/${fieldName}/${file.filename}`;
                paths.push(filePath);

                // Only optimize images (not PDFs or documents)
                if (
                  ['image', 'idDocuments', 'addressDocuments', 'serviceimage'].includes(fieldName) &&
                  file.mimetype.startsWith('image/')
                ) {
                  const fullPath = path.join(uploadsDir, fieldName, file.filename);
                  const tempPath = fullPath + '.opt';

                  try {
                    let sharpInstance = sharp(fullPath)
                      .rotate() // fix orientation
                      .resize(1200, null, { withoutEnlargement: true });

                    if (file.mimetype === 'image/png') {
                      sharpInstance = sharpInstance.png({ quality: 85 });
                    } else {
                      sharpInstance = sharpInstance.jpeg({
                        quality: 85,
                        mozjpeg: true,
                      });
                    }

                    await sharpInstance.toFile(tempPath);
                    fs.unlinkSync(fullPath);
                    fs.renameSync(tempPath, fullPath);
                  } catch (err) {
                    console.error(`Failed to optimize ${filePath}:`, err);
                    // Don't fail upload if optimization fails
                  }
                }
              }),
            );

            processedFiles[fieldName] = maxCount > 1 ? paths : paths[0];
          }),
        );
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
        };

        next();
      } catch (err) {
        next(err);
      }
    });
  };
};