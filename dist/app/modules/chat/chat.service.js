"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const mongoose_1 = require("mongoose");
const message_model_1 = require("../message/message.model");
const chat_model_1 = require("./chat.model");
const user_model_1 = require("../user/user.model");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const admin_model_1 = require("../admin/admin.model");
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
const getChatFromDB = async (user, query) => {
    // Build query to find chats where user is a participant
    const chatFilter = {
        participants: { $in: [user.id] },
    };
    if (query.searchTerm) {
        // Use QueryBuilder's native search implementation on the User model
        const userQueryBuilder = new QueryBuilder_1.default(user_model_1.User.find(), query)
            .search(['fullName', 'email']);
        const matchingUsers = await userQueryBuilder.modelQuery
            .select('_id')
            .lean();
        const matchingUserIds = matchingUsers.map((u) => u._id);
        // Add to query: at least one of the OTHER participants must be in matchingUserIds
        chatFilter.participants = {
            $all: [user.id],
            $in: matchingUserIds
        };
    }
    const chatQueryBuilder = new QueryBuilder_1.default(chat_model_1.Chat.find(chatFilter), query)
        .filter()
        .sort('-isAdminSupport -lastMessageAt')
        .paginate();
    const chats = await chatQueryBuilder.modelQuery
        .populate({
        path: 'participants',
        select: '_id fullName profilePicture role email',
        match: { _id: { $ne: user.id } }
    })
        .populate({
        path: 'lastMessage',
        select: 'text files type createdAt sender'
    })
        .select('participants status isAdminSupport lastMessage lastMessageAt')
        .lean();
    const pagination = await chatQueryBuilder.getPaginationInfo();
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
    const filteredChats = chatsWithDetails.filter((chat) => chat.participants.length > 0 || chat.isAdminSupport);
    return { data: filteredChats, pagination };
};
// Get all admin support chats (for admin panel)
const getAdminSupportChats = async (query) => {
    const chatQuery = { isAdminSupport: true };
    if (query.searchTerm) {
        // Use QueryBuilder's native search implementation on the User model
        const userQueryBuilder = new QueryBuilder_1.default(user_model_1.User.find(), query)
            .search(['fullName', 'email']);
        const matchingUsers = await userQueryBuilder.modelQuery
            .select('_id')
            .lean();
        const matchingUserIds = matchingUsers.map((u) => u._id);
        chatQuery.participants = { $in: matchingUserIds };
    }
    const chatQueryBuilder = new QueryBuilder_1.default(chat_model_1.Chat.find(chatQuery), query)
        .filter()
        .sort('-lastMessageAt')
        .paginate();
    const chats = await chatQueryBuilder.modelQuery
        .populate({
        path: 'participants',
        select: '_id fullName profilePicture email role'
    })
        .populate({
        path: 'lastMessage',
        select: 'text files type createdAt sender'
    })
        .select('participants status isAdminSupport lastMessage lastMessageAt')
        .lean();
    const pagination = await chatQueryBuilder.getPaginationInfo();
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
    return { data: chatsWithUnreadCount, pagination };
};
// Delete a chat
const deleteChatFromDB = async (chatId, userId) => {
    const chat = await chat_model_1.Chat.findById(chatId);
    if (!chat) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Chat not found');
    }
    // Check if user is a participant
    const isParticipant = chat.participants.some((p) => p.toString() === userId);
    if (!isParticipant && await admin_model_1.Admin.findById(userId)) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'You are not authorized to delete this chat');
    }
    // Delete all messages in the chat
    await message_model_1.Message.deleteMany({ chatId });
    // Delete the chat
    await chat_model_1.Chat.findByIdAndDelete(chatId);
};
// Check for support availability (09:00 - 16:00 CET, Mon-Fri)
const getSupportAvailability = async () => {
    var _a, _b;
    const now = new Date();
    // ✅ Robust way to get CET day and hour regardless of server locale
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'CET',
        hour: 'numeric',
        weekday: 'long',
        hourCycle: 'h23'
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(((_a = parts.find(p => p.type === 'hour')) === null || _a === void 0 ? void 0 : _a.value) || '0');
    const weekday = ((_b = parts.find(p => p.type === 'weekday')) === null || _b === void 0 ? void 0 : _b.value) || '';
    const workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const isWorkingDay = workingDays.includes(weekday);
    const isWorkingHour = hour >= 9 && hour < 16;
    console.log(`[SupportCheck] CET Weekday: ${weekday}, CET Hour: ${hour}, Result: ${isWorkingDay && isWorkingHour}`);
    return isWorkingDay && isWorkingHour;
};
exports.ChatService = {
    createChatToDB,
    createAdminSupportChat,
    getChatFromDB,
    getAdminSupportChats,
    deleteChatFromDB,
    getSupportAvailability
};
