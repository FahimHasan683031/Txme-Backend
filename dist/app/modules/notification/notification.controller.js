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
const pushNotification_service_1 = require("./pushNotification.service");
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
const sendTestPushNotification = (0, catchAsync_1.default)(async (req, res) => {
    const { token, title, body } = req.body;
    console.log("--- TEST PUSH NOTIFICATION REQUEST ---");
    console.log("Received Token:", token);
    console.log("Title:", title);
    console.log("Body:", body);
    const result = await pushNotification_service_1.PushNotificationService.sendPushNotification(token || "c0UaCLXGSJ6JsC62K6NPq0:APA91bHzTTe3umtCk7TzNcOXN-aa3SPNQVOtgx6jwQvz1OiTDKLJEIPc-A-8Wn707pYzKnwDZA1nH2zDNvkxTPbpB7SUMAYO3odSW8PEFzCopYf930fNLHE", title || "Test Notification", body || "This is a test notification from Txme Backend! 🚀", {
        screen: "HOME",
        type: "TEST"
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Test notification sent successfully',
        data: result
    });
});
exports.NotificationController = {
    adminNotificationFromDB,
    getNotificationFromDB,
    getUnreadCount,
    adminGetUnreadCount,
    sendTestPushNotification
};
