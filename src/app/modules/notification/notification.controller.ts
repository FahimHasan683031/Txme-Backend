import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';
import { FilterQuery } from 'mongoose';

const getNotificationFromDB = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.getNotificationFromDB(req.user, req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Notifications Retrieved Successfully',
        data: result,
    });
}
);

const adminNotificationFromDB = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.adminNotificationFromDB(req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Notifications Retrieved Successfully',
        data: result
    });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.getUnreadCountFromDB(req.user);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Unread Notification Count Retrieved Successfully',
        data: result
    });
});

const adminGetUnreadCount = catchAsync(async (req: Request, res: Response) => {
    const result = await NotificationService.adminGetUnreadCountFromDB();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Unread Notification Count Retrieved Successfully',
        data: result
    });
});

export const NotificationController = {
    adminNotificationFromDB,
    getNotificationFromDB,
    getUnreadCount,
    adminGetUnreadCount
};
