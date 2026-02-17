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
const pushNotification_service_1 = require("../notification/pushNotification.service");
const notification_service_1 = require("../notification/notification.service");
const user_model_1 = require("../user/user.model");
const user_1 = require("../../../enums/user");
const admin_model_1 = require("../admin/admin.model");
const sendMessageToDB = async (payload) => {
    var _a, _b, _c;
    // Initialize readBy with sender's ID
    payload.readBy = [payload.sender];
    if (payload.type === message_1.MESSAGE.MoneyRequest) {
        await (0, checkSetting_1.checkWalletSetting)('moneyRequest');
        if (!payload.amount || payload.amount <= 0) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Amount is required for money requests and must be greater than 0");
        }
        payload.moneyRequestStatus = 'pending';
        if (await chat_model_1.Chat.findById(payload.chatId).isAdminSupport) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "You can't send money request to admin support chat");
        }
    }
    const isExistChat = await chat_model_1.Chat.findById(payload.chatId);
    if (!isExistChat) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Chat doesn't exist!");
    }
    const isExistAdmin = await admin_model_1.Admin.findById(payload.sender);
    if (!isExistChat.participants.includes(payload.sender) && !isExistAdmin) {
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
        // If it's an admin support chat, also notify ALL admins (for admin dashboard update)
        if (isExistChat.isAdminSupport) {
            console.log(`[Socket] Emitting adminChatListUpdate for chatId: ${payload.chatId}`);
            io.emit('adminChatListUpdate', {
                chatId: payload.chatId,
                lastMessage: response,
            });
        }
    }
    // Send Push Notification
    try {
        const chatStatus = await chat_model_1.Chat.findById(payload.chatId);
        if (!chatStatus)
            return response;
        // Fetch sender details for better title
        const sender = await user_model_1.User.findById(payload.sender).select('fullName role');
        const title = (sender === null || sender === void 0 ? void 0 : sender.fullName) || "New Message";
        const body = payload.text ?
            (payload.text.length > 50 ? payload.text.substring(0, 50) + "..." : payload.text) :
            "Sent an attachment";
        if (chatStatus.isAdminSupport) {
            // For Admin Support, notify all admins except the sender (if sender is an admin)
            // or all admins if sender is a user
            const admins = await user_model_1.User.find({
                role: { $in: [user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN] },
                _id: { $ne: payload.sender }
            }).select('fcmToken');
            const adminTokens = admins.map(a => a.fcmToken).filter(Boolean);
            // Send to each admin (Firebase Admin SDK .send() takes one token, or use .sendEachForMulticast)
            if (adminTokens.length > 0) {
                for (const token of adminTokens) {
                    await pushNotification_service_1.PushNotificationService.sendPushNotification(token, `Support: ${title}`, body, { screen: "CHAT", chatId: (_a = payload.chatId) === null || _a === void 0 ? void 0 : _a.toString() });
                }
            }
            // If the sender is an admin, notify the user as well
            const isSenderAdmin = [user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN].includes(sender === null || sender === void 0 ? void 0 : sender.role);
            if (isSenderAdmin) {
                const userParticipant = await user_model_1.User.findById(chatStatus.participants[0]).select('fcmToken');
                if (userParticipant === null || userParticipant === void 0 ? void 0 : userParticipant.fcmToken) {
                    await pushNotification_service_1.PushNotificationService.sendPushNotification(userParticipant.fcmToken, title, body, { screen: "CHAT", chatId: (_b = payload.chatId) === null || _b === void 0 ? void 0 : _b.toString() });
                }
            }
        }
        else {
            // Normal Chat recipient
            const recipientId = chatStatus.participants.find((p) => p.toString() !== payload.sender.toString());
            if (recipientId) {
                const recipient = await user_model_1.User.findById(recipientId).select('fcmToken');
                if (recipient === null || recipient === void 0 ? void 0 : recipient.fcmToken) {
                    await pushNotification_service_1.PushNotificationService.sendPushNotification(recipient.fcmToken, title, body, { screen: "CHAT", chatId: (_c = payload.chatId) === null || _c === void 0 ? void 0 : _c.toString() });
                }
            }
        }
    }
    catch (error) {
        console.error("Failed to send push notification:", error);
        // Don't block the response if notification fails
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
        .sort({ createdAt: -1 }), query).paginate();
    let messages = await result.modelQuery;
    const pagination = await result.getPaginationInfo();
    messages = messages.reverse();
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
    //@ts-ignore
    const io = global.io;
    if (io && updatedMessage) {
        io.emit(`getMessage::${updatedMessage.chatId}`, updatedMessage);
    }
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
    // --- Send Push Notification to Request Sender ---
    try {
        const title = status === 'accepted' ? "Money Request Accepted" : "Money Request Rejected";
        const body = status === 'accepted'
            ? `Your request for ${message.amount} has been accepted.`
            : `Your request for ${message.amount} has been rejected.`;
        await notification_service_1.NotificationService.insertNotification({
            title,
            message: body,
            receiver: message.sender, // Notify the person who requested the money
            referenceId: message.chatId, // Redirect to the chat
            screen: "CHAT",
            type: "USER"
        });
    }
    catch (error) {
        console.error(`[MessageService] Failed to send money request notification:`, error);
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
