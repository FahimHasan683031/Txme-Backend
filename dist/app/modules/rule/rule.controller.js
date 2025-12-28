"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const rule_service_1 = require("./rule.service");
const createPrivacyPolicy = (0, catchAsync_1.default)(async (req, res) => {
    const result = await rule_service_1.RuleService.createPrivacyPolicyToDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Privacy policy created successfully',
        data: result
    });
});
const getPrivacyPolicy = (0, catchAsync_1.default)(async (req, res) => {
    const result = await rule_service_1.RuleService.getPrivacyPolicyFromDB();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Privacy policy retrieved successfully',
        data: result
    });
});
const createTermsAndCondition = (0, catchAsync_1.default)(async (req, res) => {
    const result = await rule_service_1.RuleService.createTermsAndConditionToDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Terms and conditions created successfully',
        data: result
    });
});
const getTermsAndCondition = (0, catchAsync_1.default)(async (req, res) => {
    const result = await rule_service_1.RuleService.getTermsAndConditionFromDB();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Terms and conditions retrieved successfully',
        data: result
    });
});
const createAbout = (0, catchAsync_1.default)(async (req, res) => {
    const result = await rule_service_1.RuleService.createAboutToDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'About created successfully',
        data: result
    });
});
const getAbout = (0, catchAsync_1.default)(async (req, res) => {
    const result = await rule_service_1.RuleService.getAboutFromDB();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'About retrieved successfully',
        data: result
    });
});
exports.RuleController = {
    createPrivacyPolicy,
    getPrivacyPolicy,
    createTermsAndCondition,
    getTermsAndCondition,
    createAbout,
    getAbout
};
