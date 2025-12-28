"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const auth_service_1 = require("./auth.service");
const loginUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.loginUserFromDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "User login successfully",
        data: result,
    });
});
const refreshToken = (0, catchAsync_1.default)(async (req, res) => {
    const { token } = req.body;
    const result = await auth_service_1.AuthService.newAccessTokenToUser(token);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Generate Access Token successfully",
        data: result,
    });
});
const deleteUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.deleteUserFromDB(req.user, req.body.phone);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result,
    });
});
// Separate send OTP controllers
const sendEmailOtp = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.sendEmailOtp(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "OTP sent to email",
        data: result,
    });
});
const sendPhoneOtp = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.sendPhoneOtp(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "OTP sent to phone",
        data: result,
    });
});
const sendPasswordResetOtp = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.sendPasswordResetOtp(req.body.email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "OTP sent for password reset",
        data: result,
    });
});
const sendNumberChangeOtp = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.sendNumberChangeOtp(req.body.oldPhone, req.body.newPhone);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "OTP sent for number change",
        data: result,
    });
});
// Common Verify Controller
const verifyOtp = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.verifyOtp(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: result.message,
        data: result.data,
    });
});
const completeProfile = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.completeProfile(req.user, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Profile updated successfully",
        data: result,
    });
});
const resendOtp = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.resendOtp(req.body.identifier);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "OTP resent successfully",
        data: result,
    });
});
const enableBiometric = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.enableBiometric(req.body.email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Biometric enabled successfully",
        data: result,
    });
});
const biometricLogin = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.biometricLogin(req.body.biometricToken);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Biometric login successful",
        data: result,
    });
});
exports.AuthController = {
    sendEmailOtp,
    sendPhoneOtp,
    sendPasswordResetOtp,
    sendNumberChangeOtp,
    verifyOtp,
    loginUser,
    refreshToken,
    deleteUser,
    completeProfile,
    resendOtp,
    enableBiometric,
    biometricLogin,
};
