"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const auditLog_service_1 = require("./auditLog.service");
const getAuditLogs = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auditLog_service_1.AuditLogService.getLogsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Audit logs retrieved successfully',
        data: result
    });
});
exports.AuditLogController = {
    getAuditLogs
};
