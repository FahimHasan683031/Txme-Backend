import express, { NextFunction, Request, Response } from "express";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import { AuthController } from "./auth.controller";
import validateRequest from "../../middlewares/validateRequest";
import {
  completeProfileZod,
  loginZod,
  resendOtpSchema,
  sendEmailOtpZod,
  sendNumberChangeOtpZod,
  sendPasswordResetOtpZod,
  sendPhoneOtpZod,
  verifyOtpZod,
} from "../user/user.validation";
import { fileAndBodyProcessorUsingDiskStorage } from "../../middlewares/processReqBody";
const router = express.Router();

// Separate OTP Send APIs
router.post(
  "/send-email-otp",
  validateRequest(sendEmailOtpZod),
  AuthController.sendEmailOtp
);
router.post(
  "/send-phone-otp",
  validateRequest(sendPhoneOtpZod),
  AuthController.sendPhoneOtp
);
router.post(
  "/send-password-otp",
  validateRequest(sendPasswordResetOtpZod),
  AuthController.sendPasswordResetOtp
);
router.post(
  "/send-number-change-otp",
  validateRequest(sendNumberChangeOtpZod),
  AuthController.sendNumberChangeOtp
);

// Common Verify API
router.post(
  "/verify-otp",
  validateRequest(verifyOtpZod),
  AuthController.verifyOtp
);

router.post("/login", validateRequest(loginZod), AuthController.loginUser);


router.post("/refresh-token", AuthController.refreshToken);



router.patch(
  "/complete-profile",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(completeProfileZod),
  AuthController.completeProfile
);

// Resend OTP
router.post(
  "/resend-otp",
  validateRequest(resendOtpSchema),
  AuthController.resendOtp
);



router.delete(
  "/delete-account",
  auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
  AuthController.deleteUser
);

router.post(
  "/enable-biometric",
  AuthController.enableBiometric
);

router.post(
  "/biometric-login",
  AuthController.biometricLogin
);


export const AuthRoutes = router;
