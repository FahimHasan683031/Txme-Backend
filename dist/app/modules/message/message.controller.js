"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const message_service_1 = require("./message.service");
const sendMessage = (0, catchAsync_1.default)(async (req, res) => {
    req.body.sender = req.user.id;
    const message = await message_service_1.MessageService.sendMessageToDB(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Send Message Successfully',
        data: message,
    });
});
const getMessage = (0, catchAsync_1.default)(async (req, res) => {
    const messages = await message_service_1.MessageService.getMessageFromDB(req.params.id, req.user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message Retrieve Successfully',
        data: messages,
    });
});
const updateMessage = (0, catchAsync_1.default)(async (req, res) => {
    const result = await message_service_1.MessageService.updateMessageToDB(req.params.id, req.user.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message Updated Successfully',
        data: result,
    });
});
const getUnreadCount = (0, catchAsync_1.default)(async (req, res) => {
    const count = await message_service_1.MessageService.getTotalUnreadCount(req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Unread count retrieved successfully',
        data: { unreadCount: count },
    });
});
const deleteMessage = (0, catchAsync_1.default)(async (req, res) => {
    const result = await message_service_1.MessageService.deleteMessageFromDB(req.params.id, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message Deleted Successfully',
        data: result,
    });
});
const updateMoneyRequestStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { messageId } = req.params;
    const { status } = req.body;
    const result = await message_service_1.MessageService.updateMoneyRequestStatusToDB(messageId, req.user, status);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: `Money request ${status} successfully`,
        data: result
    });
});
exports.MessageController = {
    sendMessage,
    getMessage,
    updateMessage,
    getUnreadCount,
    deleteMessage,
    updateMoneyRequestStatus
};
