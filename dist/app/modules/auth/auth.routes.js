"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const auth_controller_1 = require("./auth.controller");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_validation_1 = require("../user/user.validation");
const processReqBody_1 = require("../../middlewares/processReqBody");
const router = express_1.default.Router();
// Separate OTP Send APIs
router.post("/send-email-otp", (0, validateRequest_1.default)(user_validation_1.sendEmailOtpZod), auth_controller_1.AuthController.sendEmailOtp);
router.post("/send-phone-otp", (0, validateRequest_1.default)(user_validation_1.sendPhoneOtpZod), auth_controller_1.AuthController.sendPhoneOtp);
router.post("/send-password-otp", (0, validateRequest_1.default)(user_validation_1.sendPasswordResetOtpZod), auth_controller_1.AuthController.sendPasswordResetOtp);
router.post("/send-number-change-otp", (0, validateRequest_1.default)(user_validation_1.sendNumberChangeOtpZod), auth_controller_1.AuthController.sendNumberChangeOtp);
// Common Verify API
router.post("/verify-otp", (0, validateRequest_1.default)(user_validation_1.verifyOtpZod), auth_controller_1.AuthController.verifyOtp);
router.post("/login", (0, validateRequest_1.default)(user_validation_1.loginZod), auth_controller_1.AuthController.loginUser);
router.post("/refresh-token", auth_controller_1.AuthController.refreshToken);
router.patch("/complete-profile", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), (0, processReqBody_1.fileAndBodyProcessorUsingDiskStorage)(), (0, validateRequest_1.default)(user_validation_1.completeProfileZod), auth_controller_1.AuthController.completeProfile);
// Resend OTP
router.post("/resend-otp", (0, validateRequest_1.default)(user_validation_1.resendOtpSchema), auth_controller_1.AuthController.resendOtp);
router.delete("/delete-account", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), auth_controller_1.AuthController.deleteUser);
router.post("/enable-biometric", auth_controller_1.AuthController.enableBiometric);
router.post("/biometric-login", auth_controller_1.AuthController.biometricLogin);
exports.AuthRoutes = router;
