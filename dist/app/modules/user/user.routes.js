"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const user_controller_1 = require("./user.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const fileUploaderHandler_1 = __importDefault(require("../../middlewares/fileUploaderHandler"));
const getFilePath_1 = require("../../../shared/getFilePath");
const user_validation_1 = require("./user.validation");
const router = express_1.default.Router();
router.route('/')
    .get((0, auth_1.default)(user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN, user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), user_controller_1.UserController.getAllUsers)
    .patch((0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), (0, fileUploaderHandler_1.default)(), async (req, res, next) => {
    try {
        const profile = (0, getFilePath_1.getSingleFilePath)(req.files, "image");
        req.body = { profile, ...req.body };
        next();
    }
    catch (error) {
        res.status(500).json({ message: "Failed to upload image" });
    }
}, user_controller_1.UserController.updateProfile);
// get my profile
router.patch('/fcm-token', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), user_controller_1.UserController.updateFcmToken);
router.get('/my-profile', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), user_controller_1.UserController.getMyProfile);
// get single user
router.get('/:id', 
// auth(USER_ROLES.ADMIN, USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, USER_ROLES.SUPER_ADMIN),
user_controller_1.UserController.getSingleUser);
// update user status (admin only)
router.patch('/:userId/status', (0, auth_1.default)(user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(user_validation_1.updateUserStatusZodSchema), user_controller_1.UserController.updateUserStatus);
// delete user (super admin only)
router.delete('/:userId', (0, auth_1.default)(user_1.ADMIN_ROLES.SUPER_ADMIN), (0, validateRequest_1.default)(require('./user.validation').userIdParamZodSchema), user_controller_1.UserController.deleteUser);
exports.UserRoutes = router;
