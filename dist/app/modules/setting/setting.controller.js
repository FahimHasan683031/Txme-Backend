"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const setting_service_1 = require("./setting.service");
const getSetting = (0, catchAsync_1.default)(async (req, res) => {
    const result = await setting_service_1.SettingService.getSetting();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Settings retrieved successfully',
        data: result
    });
});
const updateSetting = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const result = await setting_service_1.SettingService.updateSetting(req.body, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Settings updated successfully',
        data: result
    });
});
exports.SettingController = {
    getSetting,
    updateSetting
};
