"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const support_service_1 = require("./support.service");
const makeSupport = (0, catchAsync_1.default)(async (req, res, next) => {
    const result = await support_service_1.SupportService.makeSupportInDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Support Submitted",
        data: result
    });
});
const supports = (0, catchAsync_1.default)(async (req, res, next) => {
    const result = await support_service_1.SupportService.supportsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Support List Retrieved',
        data: result
    });
});
exports.SupportController = {
    makeSupport,
    supports
};
