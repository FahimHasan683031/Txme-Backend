import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { ChatService } from "./chat.service";
import { JwtPayload } from "jsonwebtoken";

const createChat = catchAsync(async (req: Request, res: Response) => {
    const chat = await ChatService.createChatToDB(req.body);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Create Chat Successfully',
        data: chat,
    });
});

const createAdminSupport = catchAsync(async (req: Request, res: Response) => {
    const chat = await ChatService.createAdminSupportChat(req.user.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Admin Support Chat Created Successfully',
        data: chat,
    });
});

const getChat = catchAsync(async (req: Request, res: Response) => {
    const chatList = await ChatService.getChatFromDB(
        req.user as JwtPayload,
        req.query.search as string
    );

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Chat Retrieve Successfully',
        data: chatList
    });
});

const getAdminSupportChats = catchAsync(async (req: Request, res: Response) => {
    const chatList = await ChatService.getAdminSupportChats();

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Admin Support Chats Retrieved Successfully',
        data: chatList
    });
});

const deleteChat = catchAsync(async (req: Request, res: Response) => {
    await ChatService.deleteChatFromDB(req.params.id, req.user.id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Chat Deleted Successfully',
        data: null
    });
});

export const ChatController = {
    createChat,
    createAdminSupport,
    getChat,
    getAdminSupportChats,
    deleteChat
};