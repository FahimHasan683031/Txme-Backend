import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { MessageService } from './message.service';

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const message = await MessageService.sendMessageToDB(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Send Message Successfully',
    data: message,
  });
});

const getMessage = catchAsync(async (req: Request, res: Response) => {
  const messages = await MessageService.getMessageFromDB(
    req.params.id,
    req.user,
    req.query
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message Retrieve Successfully',
    data: messages,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  await MessageService.markMessagesAsRead(req.params.chatId, req.user.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Messages marked as read',
    data: null,
  });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const count = await MessageService.getTotalUnreadCount(req.user.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Unread count retrieved successfully',
    data: { unreadCount: count },
  });
});

export const MessageController = {
  sendMessage,
  getMessage,
  markAsRead,
  getUnreadCount
};
