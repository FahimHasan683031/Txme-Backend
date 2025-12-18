import express from 'express';
import auth from '../../middlewares/auth';
import { ADMIN_ROLES, USER_ROLES, } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
import { AdminValidation } from './admin.validation';
import { AdminController } from './admin.controller';
const router = express.Router();

// create admin
router.post(
  '/',
  auth(ADMIN_ROLES.SUPER_ADMIN),
  validateRequest(AdminValidation.createAdminZodSchema),
  AdminController.createAdmin
);



router.post(
  '/login',
  validateRequest(AdminValidation.loginZodSchema),
  AdminController.loginAdmin
);

router.post(
  '/forget-password',
  validateRequest(AdminValidation.forgetPasswordZodSchema),
  AdminController.forgetPassword
);

router.post(
  '/verify-otp',
  validateRequest(AdminValidation.verifyOTPZodSchema),
  AdminController.verifyEmail
);



router.post(
  '/reset-password',
  validateRequest(AdminValidation.resetPasswordZodSchema),
  AdminController.resetPassword
);

router.post(
  '/change-password',
  auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
  validateRequest(AdminValidation.changePasswordZodSchema),
  AdminController.changePassword
);

export const AdminRoutes = router;
