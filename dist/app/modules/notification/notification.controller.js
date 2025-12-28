"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const notification_service_1 = require("./notification.service");
const getNotificationFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const result = await notification_service_1.NotificationService.getNotificationFromDB(req.user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Notifications Retrieved Successfully',
        data: result,
    });
});
const adminNotificationFromDB = (0, catchAsync_1.default)(async (req, res) => {
    const result = await notification_service_1.NotificationService.adminNotificationFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Notifications Retrieved Successfully',
        data: result
    });
});
const getUnreadCount = (0, catchAsync_1.default)(async (req, res) => {
    const result = await notification_service_1.NotificationService.getUnreadCountFromDB(req.user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Unread Notification Count Retrieved Successfully',
        data: result
    });
});
const adminGetUnreadCount = (0, catchAsync_1.default)(async (req, res) => {
    const result = await notification_service_1.NotificationService.adminGetUnreadCountFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Unread Notification Count Retrieved Successfully',
        data: result
    });
});
exports.NotificationController = {
    adminNotificationFromDB,
    getNotificationFromDB,
    getUnreadCount,
    adminGetUnreadCount
};
