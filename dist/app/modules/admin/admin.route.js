"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const admin_validation_1 = require("./admin.validation");
const admin_controller_1 = require("./admin.controller");
const router = express_1.default.Router();
// create admin
router.post('/', (0, auth_1.default)(user_1.ADMIN_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(admin_validation_1.AdminValidation.createAdminZodSchema), admin_controller_1.AdminController.createAdmin);
router.get('/', (0, auth_1.default)(user_1.ADMIN_ROLES.SUPER_ADMIN), admin_controller_1.AdminController.getAllAdmins);
router.post('/login', (0, validateRequest_1.default)(admin_validation_1.AdminValidation.loginZodSchema), admin_controller_1.AdminController.loginAdmin);
router.post('/forget-password', (0, validateRequest_1.default)(admin_validation_1.AdminValidation.forgetPasswordZodSchema), admin_controller_1.AdminController.forgetPassword);
router.post('/verify-otp', (0, validateRequest_1.default)(admin_validation_1.AdminValidation.verifyOTPZodSchema), admin_controller_1.AdminController.verifyEmail);
router.post('/reset-password', (0, validateRequest_1.default)(admin_validation_1.AdminValidation.resetPasswordZodSchema), admin_controller_1.AdminController.resetPassword);
router.post('/change-password', (0, auth_1.default)(user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(admin_validation_1.AdminValidation.changePasswordZodSchema), admin_controller_1.AdminController.changePassword);
// toggle user status (active/blocked)
router.patch('/:userId/toggle-status', (0, auth_1.default)(user_1.ADMIN_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(admin_validation_1.AdminValidation.userIdParamZodSchema), admin_controller_1.AdminController.toggleUserStatus);
// delete user (soft delete)
router.delete('/:userId', (0, auth_1.default)(user_1.ADMIN_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(admin_validation_1.AdminValidation.userIdParamZodSchema), admin_controller_1.AdminController.deleteUser);
exports.AdminRoutes = router;
