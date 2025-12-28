"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const admin_service_1 = require("./admin.service");
const config_1 = __importDefault(require("../../../config"));
// create admin
const createAdmin = (0, catchAsync_1.default)(async (req, res) => {
    const { ...adminData } = req.body;
    const result = await admin_service_1.AdminService.createAdminToDB(adminData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        message: 'Admin created successfully.',
        data: result,
    });
});
// Get all admins
const getAllAdmins = (0, catchAsync_1.default)(async (req, res) => {
    const { ...query } = req.query;
    const result = await admin_service_1.AdminService.getAllAdminsFromDB(query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Admins fetched successfully.',
        data: result,
    });
});
const verifyEmail = (0, catchAsync_1.default)(async (req, res) => {
    const { ...verifyData } = req.body;
    const result = await admin_service_1.AdminService.verifyEmailToDB(verifyData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});
const loginAdmin = (0, catchAsync_1.default)(async (req, res) => {
    const { ...loginData } = req.body;
    const result = await admin_service_1.AdminService.loginAdminFromDB(loginData);
    res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: config_1.default.node_env === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User logged in successfully.',
        data: result,
    });
});
const forgetPassword = (0, catchAsync_1.default)(async (req, res) => {
    const email = req.body.email;
    const result = await admin_service_1.AdminService.forgetPasswordToDB(email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Please check your email. We have sent you a one-time passcode (OTP).',
        data: result,
    });
});
const resetPassword = (0, catchAsync_1.default)(async (req, res) => {
    const token = req.headers.authorization;
    const { ...resetData } = req.body;
    const result = await admin_service_1.AdminService.resetPasswordToDB(token, resetData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Your password has been successfully reset.',
        data: result,
    });
});
const changePassword = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { ...passwordData } = req.body;
    await admin_service_1.AdminService.changePasswordToDB(user, passwordData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Your password has been successfully changed',
    });
});
const toggleUserStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await admin_service_1.AdminService.toggleUserStatusInDB(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User status updated successfully',
        data: result,
    });
});
const deleteUser = (0, catchAsync_1.default)(async (req, res) => {
    const { userId } = req.params;
    const result = await admin_service_1.AdminService.deleteUserFromDB(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result.message,
    });
});
exports.AdminController = {
    verifyEmail,
    loginAdmin,
    forgetPassword,
    resetPassword,
    changePassword,
    createAdmin,
    toggleUserStatus,
    deleteUser,
    getAllAdmins
};
