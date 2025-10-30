import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { createUserZodValidationSchema } from './user.validation';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';
import { getSingleFilePath } from '../../../shared/getFilePath';
const router = express.Router();

router.route('/')
    .post(
        validateRequest(createUserZodValidationSchema),
        UserController.createUser
    )
    .get(
        auth(USER_ROLES.ADMIN, USER_ROLES.CUSTOMER, USER_ROLES.VENDOR, USER_ROLES.SUPER_ADMIN),
        UserController.getUserProfile
    )
    .patch(
        auth(USER_ROLES.ADMIN, USER_ROLES.CUSTOMER, USER_ROLES.VENDOR, USER_ROLES.SUPER_ADMIN),
        fileUploadHandler(),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const profile = getSingleFilePath(req.files, "image");
                req.body = { profile, ...req.body};
                next();

            } catch (error) {
                res.status(500).json({ message: "Failed to upload image" });
            }
        },
        UserController.updateProfile
    );

export const UserRoutes = router;