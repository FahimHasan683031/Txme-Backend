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
    const result = await notification_model_1.Notification.create(payload);
    // --- PUSH NOTIFICATION ---
    if (result.title && result.message) {
        console.log(`[NotificationService] Processing push for: ${result.title}. Type: ${result.type}`);
        if (result.type === 'ADMIN') {
            const admins = await user_model_1.User.find({
                role: { $in: ['ADMIN', 'SUPER_ADMIN'] }
            }).select('fcmToken');
            const adminTokens = admins.map(a => a.fcmToken).filter(Boolean);
            console.log(`[NotificationService] Found ${adminTokens.length} admin tokens`);
            if (adminTokens.length > 0) {
                for (const token of adminTokens) {
                    await pushNotification_service_1.PushNotificationService.sendPushNotification(token, `Admin: ${result.title}`, result.message, { referenceId: result.referenceId, screen: result.screen });
                }
            }
        }
        else if (result.receiver) {
            const receiverId = result.receiver.toString();
            console.log(`[NotificationService] Fetching token for receiver: ${receiverId}`);
            const receiverUser = await user_model_1.User.findById(receiverId).select('fcmToken fullName');
            if (receiverUser) {
                if (receiverUser.fcmToken) {
                    console.log(`[NotificationService] Sending push to ${receiverUser.fullName || 'User'} (Token found)`);
                    await pushNotification_service_1.PushNotificationService.sendPushNotification(receiverUser.fcmToken, result.title, result.message, { referenceId: result.referenceId, screen: result.screen });
                }
                else {
                    console.warn(`[NotificationService] Push skipped: No fcmToken found for user ${receiverId}`);
                }
            }
            else {
                console.error(`[NotificationService] Push error: Receiver user not found in DB: ${receiverId}`);
            }
        }
    }
    // --- SOCKET NOTIFICATION ---
    //@ts-ignore
    const io = global.io;
    if (io) {
        if (result.type === 'ADMIN') {
            io.emit('admin-notification', result);
        }
        else if (result.receiver) {
            io.emit(`notification::${result.receiver.toString()}`, result);
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
