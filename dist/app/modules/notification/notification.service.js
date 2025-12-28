"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notification_model_1 = require("./notification.model");
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const pushNotification_service_1 = require("./pushNotification.service");
const user_model_1 = require("../user/user.model");
// insert notification
const insertNotification = async (payload) => {
    var _a;
    const result = await notification_model_1.Notification.create(payload);
    // If there's a receiver and title/message, try to send a push notification
    if (result.receiver && result.title && result.message) {
        const receiverUser = await user_model_1.User.findById(result.receiver).select('fcmToken');
        if (receiverUser === null || receiverUser === void 0 ? void 0 : receiverUser.fcmToken) {
            await pushNotification_service_1.PushNotificationService.sendPushNotification(receiverUser.fcmToken, result.title, result.message, { referenceId: ((_a = result.referenceId) === null || _a === void 0 ? void 0 : _a.toString()) || '', screen: result.screen || '' });
        }
    }
    return result;
};
// get notifications
const getNotificationFromDB = async (user, query) => {
    const result = new QueryBuilder_1.default(notification_model_1.Notification.find({ receiver: user.id }), query).paginate().sort();
    const notifications = await result.modelQuery;
    const pagination = await result.getPaginationInfo();
    const unreadCount = await notification_model_1.Notification.countDocuments({
        receiver: user.id,
        read: false,
    });
    // Mark all unread notifications for this user as read
    await notification_model_1.Notification.updateMany({ receiver: user.id, read: false }, { $set: { read: true } });
    const data = {
        notifications,
        pagination,
        unreadCount
    };
    return data;
};
// get unread notification count
const getUnreadCountFromDB = async (user) => {
    const count = await notification_model_1.Notification.countDocuments({
        receiver: user.id,
        read: false,
    });
    return count;
};
// get notifications for admin
const adminNotificationFromDB = async (query) => {
    const result = new QueryBuilder_1.default(notification_model_1.Notification.find({ type: "ADMIN" }), query).paginate().sort();
    const notifications = await result.modelQuery;
    const pagination = await result.getPaginationInfo();
    const unreadCount = await notification_model_1.Notification.countDocuments({
        type: 'ADMIN',
        read: false,
    });
    // Mark all unread admin notifications as read
    await notification_model_1.Notification.updateMany({ type: 'ADMIN', read: false }, { $set: { read: true } });
    return { notifications, pagination, unreadCount };
};
// get unread count for admin
const adminGetUnreadCountFromDB = async () => {
    const count = await notification_model_1.Notification.countDocuments({
        type: 'ADMIN',
        read: false,
    });
    return count;
};
exports.NotificationService = {
    insertNotification,
    getNotificationFromDB,
    getUnreadCountFromDB,
    adminNotificationFromDB,
    adminGetUnreadCountFromDB
};
