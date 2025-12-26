import express, { NextFunction, Request, Response } from 'express';
import { ADMIN_ROLES, USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';
import { getSingleFilePath } from '../../../shared/getFilePath';
import { updateUserStatusZodSchema } from './user.validation';
const router = express.Router();

router.route('/')
    .get(
        auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN, USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
        UserController.getAllUsers
    )
    .patch(
        auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
        fileUploadHandler(),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const profile = getSingleFilePath(req.files, "image");
                req.body = { profile, ...req.body };
                next();

            } catch (error) {
                res.status(500).json({ message: "Failed to upload image" });
            }
        },
        UserController.updateProfile
    );

// get popular providers
router.get('/popular-providers',
    UserController.getPopularProviders
);

// get my profile
router.get('/me',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    UserController.getMyProfile
);

// get single user
router.get('/:id',
    // auth(USER_ROLES.ADMIN, USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, USER_ROLES.SUPER_ADMIN),
    UserController.getSingleUser
);

// update user status (admin only)
router.patch('/:userId/status',
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    validateRequest(updateUserStatusZodSchema),
    UserController.updateUserStatus
);

// delete user (super admin only)
router.delete('/:userId',
    auth(ADMIN_ROLES.SUPER_ADMIN),
    validateRequest(require('./user.validation').userIdParamZodSchema),
    UserController.deleteUser
);



export const UserRoutes = router;
