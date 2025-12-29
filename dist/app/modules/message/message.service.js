"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const message_model_1 = require("./message.model");
const checkMongooseIDValidation_1 = require("../../../shared/checkMongooseIDValidation");
const chat_model_1 = require("../chat/chat.model");
const wallet_service_1 = require("../wallet/wallet.service");
const message_1 = require("../../../enums/message");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const checkSetting_1 = require("../../../helpers/checkSetting");
const sendMessageToDB = async (payload) => {
    // Initialize readBy with sender's ID
    payload.readBy = [payload.sender];
    if (payload.type === message_1.MESSAGE.MoneyRequest) {
        await (0, checkSetting_1.checkWalletSetting)('moneyRequest');
        if (!payload.amount || payload.amount <= 0) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Amount is required for money requests and must be greater than 0");
        }
        payload.moneyRequestStatus = 'pending';
    }
    const isExistChat = await chat_model_1.Chat.findById(payload.chatId);
    if (!isExistChat) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Chat doesn't exist!");
    }
    if (!isExistChat.participants.includes(payload.sender)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You are not a participant!");
    }
    // Save to DB
    const response = await message_model_1.Message.create(payload);
    // Update chat's lastMessage and lastMessageAt
    await chat_model_1.Chat.findByIdAndUpdate(payload.chatId, {
        lastMessage: response._id,
        lastMessageAt: new Date()
    });
    //@ts-ignore
    const io = global.io;
    if (io && payload.chatId) {
        // Send message to specific Chat room
        io.emit(`getMessage::${payload === null || payload === void 0 ? void 0 : payload.chatId}`, response);
        // Notify ALL participants to update their chat list (real-time sorting)
        isExistChat.participants.forEach((participantId) => {
            io.emit(`chatListUpdate::${participantId.toString()}`, {
                chatId: payload.chatId,
                lastMessage: response,
            });
        });
    }
    return response;
};
// Get Message from db
const getMessageFromDB = async (id, user, query) => {
    (0, checkMongooseIDValidation_1.checkMongooseIDValidation)(id, "Chat");
    const isExistChat = await chat_model_1.Chat.findById(id);
    if (!isExistChat) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Chat doesn't exist!");
    }
    if (!isExistChat.participants.includes(user.id) && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new Error('You are not participant of this chat');
    }
    // Mark messages as read for this user
    await message_model_1.Message.updateMany({
        chatId: new mongoose_1.default.Types.ObjectId(id),
        sender: { $ne: new mongoose_1.default.Types.ObjectId(user.id) },
        readBy: { $ne: new mongoose_1.default.Types.ObjectId(user.id) }
    }, {
        $addToSet: { readBy: new mongoose_1.default.Types.ObjectId(user.id) }
    });
    const result = new QueryBuilder_1.default(message_model_1.Message.find({ chatId: id })
        .populate('sender', 'fullName profilePicture')
        .sort({ createdAt: 1 }), query).paginate();
    const messages = await result.modelQuery;
    const pagination = await result.getPaginationInfo();
    const participant = await chat_model_1.Chat.findById(id).populate({
        path: 'participants',
        select: '-_id fullName profilePicture ',
        match: {
            _id: { $ne: new mongoose_1.default.Types.ObjectId(user.id) }
        }
    });
    return { messages, pagination, participant: participant === null || participant === void 0 ? void 0 : participant.participants[0] };
};
// Update a message
const updateMessageToDB = async (messageId, userId, payload) => {
    const message = await message_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Message not found");
    }
    // Check if the user is the sender
    if (message.sender.toString() !== userId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You can only update your own messages");
    }
    // Update the message
    const updatedMessage = await message_model_1.Message.findByIdAndUpdate(messageId, payload, { new: true });
    return updatedMessage;
};
// Get unread message count for a specific chat
const getUnreadCountForChat = async (chatId, userId) => {
    const count = await message_model_1.Message.countDocuments({
        chatId: new mongoose_1.default.Types.ObjectId(chatId),
        sender: { $ne: new mongoose_1.default.Types.ObjectId(userId) },
        readBy: { $ne: new mongoose_1.default.Types.ObjectId(userId) }
    });
    return count;
};
// Get total unread message count for a user
const getTotalUnreadCount = async (userId) => {
    // Get all chats for this user
    const chats = await chat_model_1.Chat.find({
        participants: new mongoose_1.default.Types.ObjectId(userId)
    }).select('_id');
    const chatIds = chats.map(chat => chat._id);
    // Count unread messages across all chats
    const count = await message_model_1.Message.countDocuments({
        chatId: { $in: chatIds },
        sender: { $ne: new mongoose_1.default.Types.ObjectId(userId) },
        readBy: { $ne: new mongoose_1.default.Types.ObjectId(userId) }
    });
    return count;
};
// Delete message from DB
const deleteMessageFromDB = async (messageId, userId) => {
    const message = await message_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Message not found");
    }
    // Check if the user is the sender of the message
    if (message.sender.toString() !== userId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You can only delete your own messages");
    }
    return await message_model_1.Message.findByIdAndDelete(messageId);
};
const updateMoneyRequestStatusToDB = async (messageId, user, status) => {
    const message = await message_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Message not found");
    }
    if (message.type !== message_1.MESSAGE.MoneyRequest) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Message is not a money request");
    }
    if (message.moneyRequestStatus !== 'pending') {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Money request is already ${message.moneyRequestStatus}`);
    }
    // The sender is the one who REQUESTED money. The participant (current user) is the one who ACCEPTS/REJECTS.
    if (message.sender.toString() === user.id) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You cannot accept/reject your own money request");
    }
    if (status === 'accepted') {
        await (0, checkSetting_1.checkWalletSetting)('moneyRequest');
        if (!message.amount) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid money request: amount missing");
        }
        // Transfer money from the current user (acceptor) to the message sender (requester)
        await wallet_service_1.WalletService.sendMoney(user.id, message.sender.toString(), message.amount);
    }
    message.moneyRequestStatus = status;
    await message.save();
    // Socket notification for real-time update in chat UI
    //@ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`moneyRequestUpdate::${message.chatId}`, message);
        // Also update chat list for participants (move to top)
        const chat = await chat_model_1.Chat.findById(message.chatId);
        if (chat) {
            chat.participants.forEach((participantId) => {
                io.emit(`chatListUpdate::${participantId.toString()}`, {
                    chatId: message.chatId,
                    lastMessageAt: new Date(),
                });
            });
        }
    }
    return message;
};
exports.MessageService = {
    sendMessageToDB,
    getMessageFromDB,
    updateMessageToDB,
    getUnreadCountForChat,
    getTotalUnreadCount,
    deleteMessageFromDB,
    updateMoneyRequestStatusToDB
};
