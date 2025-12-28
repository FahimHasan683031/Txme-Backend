"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const mongoose_1 = require("mongoose");
const message_model_1 = require("../message/message.model");
const chat_model_1 = require("./chat.model");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const createChatToDB = async (payload) => {
    // Check if chat already exists between these participants
    const isExistChat = await chat_model_1.Chat.findOne({
        participants: { $all: payload.participants },
        $expr: { $eq: [{ $size: "$participants" }, payload.participants.length] }
    });
    if (isExistChat) {
        return isExistChat;
    }
    // Create new chat
    const chat = await chat_model_1.Chat.create({
        participants: payload.participants,
        isAdminSupport: payload.isAdminSupport || false
    });
    return chat;
};
// Create or get admin support chat
const createAdminSupportChat = async (userId) => {
    // Check if user already has an admin support chat
    const existingChat = await chat_model_1.Chat.findOne({
        participants: userId,
        isAdminSupport: true
    });
    if (existingChat) {
        return existingChat;
    }
    // Create new admin support chat with just the user
    // Admins will be able to see and respond to all admin support chats
    const chat = await chat_model_1.Chat.create({
        participants: [userId],
        isAdminSupport: true
    });
    return chat;
};
const getChatFromDB = async (user, search) => {
    // Build query to find chats where user is a participant
    const query = {
        participants: { $in: [user.id] },
    };
    // Populate only the other participants (not the current user)
    const chats = await chat_model_1.Chat.find(query)
        .populate({
        path: 'participants',
        select: '_id fullName profilePicture',
        match: { _id: { $ne: user.id } }
    })
        .populate({
        path: 'lastMessage',
        select: 'text files type createdAt sender'
    })
        .sort({ lastMessageAt: -1 }) // Sort by most recent message
        .select('participants status isAdminSupport lastMessage lastMessageAt')
        .lean();
    // Calculate unread count for each chat
    const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
        const unreadCount = await message_model_1.Message.countDocuments({
            chatId: chat._id,
            sender: { $ne: new mongoose_1.Types.ObjectId(user.id) },
            readBy: { $ne: new mongoose_1.Types.ObjectId(user.id) }
        });
        return {
            ...chat,
            unreadCount
        };
    }));
    // Filter out chats where participants array is empty after filtering
    const filteredChats = chatsWithDetails.filter(chat => chat.participants.length > 0 || chat.isAdminSupport);
    return filteredChats;
};
// Get all admin support chats (for admin panel)
const getAdminSupportChats = async () => {
    const chats = await chat_model_1.Chat.find({ isAdminSupport: true })
        .populate({
        path: 'participants',
        select: '_id fullName profilePicture email'
    })
        .populate({
        path: 'lastMessage',
        select: 'text files type createdAt sender'
    })
        .sort({ lastMessageAt: -1 })
        .select('participants status isAdminSupport lastMessage lastMessageAt')
        .lean();
    // Calculate unread count for each chat (from user's perspective)
    const chatsWithUnreadCount = await Promise.all(chats.map(async (chat) => {
        // Count messages not sent by any admin (i.e., sent by the user)
        const unreadCount = await message_model_1.Message.countDocuments({
            chatId: chat._id,
            readBy: { $size: 1 } // Only read by sender (the user)
        });
        return {
            ...chat,
            unreadCount
        };
    }));
    return chatsWithUnreadCount;
};
// Delete a chat
const deleteChatFromDB = async (chatId, userId) => {
    const chat = await chat_model_1.Chat.findById(chatId);
    if (!chat) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Chat not found');
    }
    // Check if user is a participant
    const isParticipant = chat.participants.some((p) => p.toString() === userId);
    if (!isParticipant) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to delete this chat');
    }
    // Delete all messages in the chat
    await message_model_1.Message.deleteMany({ chatId });
    // Delete the chat
    await chat_model_1.Chat.findByIdAndDelete(chatId);
};
exports.ChatService = {
    createChatToDB,
    createAdminSupportChat,
    getChatFromDB,
    getAdminSupportChats,
    deleteChatFromDB
};
