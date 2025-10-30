import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { AdminController } from './admin.controller';
import validateRequest from '../../middlewares/validateRequest';
import { AdminValidation } from './admin.validation';
const router = express.Router();

router.route("/")
    .post(
        auth(USER_ROLES.SUPER_ADMIN),
        validateRequest(AdminValidation.createAdminZodSchema),
        AdminController.createAdmin
    )
    .get(
        auth(USER_ROLES.SUPER_ADMIN),
        AdminController.getAdmin
    )

router.delete('/:id',
    auth(USER_ROLES.SUPER_ADMIN),
    AdminController.deleteAdmin
);

export const AdminRoutes = router;
