import express from 'express';
import auth from '../../middlewares/auth';
import { ADMIN_ROLES, USER_ROLES, } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { AdminValidation } from './admin.validation';
import { AdminController } from './admin.controller';
const router = express.Router();


router.post(
  '/login',
//   validateRequest(AdminValidation.createLoginZodSchema),
  AdminController.loginAdmin
);

router.post(
  '/forget-password',
//   validateRequest(AdminValidation.createForgetPasswordZodSchema),
  AdminController.forgetPassword
);

router.post(
  '/verify-email',
//   validateRequest(AuthValidation.createVerifyEmailZodSchema),
  AdminController.verifyEmail
);



router.post(
  '/reset-password',
//   validateRequest(AdminValidation.createResetPasswordZodSchema),
  AdminController.resetPassword
);

router.post(
  '/change-password',
  auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
//   validateRequest(AdminValidation.createChangePasswordZodSchema),
  AdminController.changePassword
);

export const AdminRoutes = router;
