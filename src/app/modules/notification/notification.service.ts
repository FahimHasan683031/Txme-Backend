import { JwtPayload } from 'jsonwebtoken';
import { INotification } from './notification.interface';
import { Notification } from './notification.model';
import { FilterQuery } from 'mongoose';
import QueryBuilder from '../../../helpers/QueryBuilder';

import { PushNotificationService } from './pushNotification.service';
import { User } from '../user/user.model';

// insert notification
const insertNotification = async (payload: Partial<INotification>): Promise<INotification> => {
    const result = await Notification.create(payload);

    // If there's a receiver and title/message, try to send a push notification
    if (result.receiver && result.title && result.message) {
        const receiverUser = await User.findById(result.receiver).select('fcmToken');
        if (receiverUser?.fcmToken) {
            await PushNotificationService.sendPushNotification(
                receiverUser.fcmToken,
                result.title,
                result.message,
                { referenceId: result.referenceId?.toString() || '', screen: result.screen || '' }
            );
        }
    }

    return result;
};

// get notifications
const getNotificationFromDB = async (user: JwtPayload, query: FilterQuery<any>): Promise<Object> => {
    const result = new QueryBuilder(Notification.find({ receiver: user.id }), query).paginate().sort();
    const notifications = await result.modelQuery;
    const pagination = await result.getPaginationInfo();

    const unreadCount = await Notification.countDocuments({
        receiver: user.id,
        read: false,
    });

    // Mark all unread notifications for this user as read
    await Notification.updateMany(
        { receiver: user.id, read: false },
        { $set: { read: true } }
    );

    const data: Record<string, any> = {
        notifications,
        pagination,
        unreadCount
    };

    return data;
};

// get unread notification count
const getUnreadCountFromDB = async (user: JwtPayload): Promise<number> => {
    const count = await Notification.countDocuments({
        receiver: user.id,
        read: false,
    });
    return count;
};

// get notifications for admin
const adminNotificationFromDB = async (query: FilterQuery<any>): Promise<{ notifications: INotification[], pagination: any, unreadCount: number }> => {
    const result = new QueryBuilder(Notification.find({ type: "ADMIN" }), query).paginate().sort();
    const notifications = await result.modelQuery;
    const pagination = await result.getPaginationInfo();

    const unreadCount = await Notification.countDocuments({
        type: 'ADMIN',
        read: false,
    });

    // Mark all unread admin notifications as read
    await Notification.updateMany(
        { type: 'ADMIN', read: false },
        { $set: { read: true } }
    );

    return { notifications, pagination, unreadCount };
};

// get unread count for admin
const adminGetUnreadCountFromDB = async (): Promise<number> => {
    const count = await Notification.countDocuments({
        type: 'ADMIN',
        read: false,
    });
    return count;
};

export const NotificationService = {
    insertNotification,
    getNotificationFromDB,
    getUnreadCountFromDB,
    adminNotificationFromDB,
    adminGetUnreadCountFromDB
};
