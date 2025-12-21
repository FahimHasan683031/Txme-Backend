import { FilterQuery, Types } from 'mongoose';
import { Message } from '../message/message.model';
import { IChat } from './chat.interface';
import { Chat } from './chat.model';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';

const createChatToDB = async (payload: {
    participants: string[];
    isAdminSupport?: boolean;
}): Promise<IChat> => {
    // Check if chat already exists between these participants
    const isExistChat: IChat | null = await Chat.findOne({
        participants: { $all: payload.participants },
        $expr: { $eq: [{ $size: "$participants" }, payload.participants.length] }
    });

    if (isExistChat) {
        return isExistChat;
    }

    // Create new chat
    const chat: IChat = await Chat.create({
        participants: payload.participants,
        isAdminSupport: payload.isAdminSupport || false
    });

    return chat;
};

// Create or get admin support chat
const createAdminSupportChat = async (userId: string): Promise<IChat> => {
    // Check if user already has an admin support chat
    const existingChat = await Chat.findOne({
        participants: userId,
        isAdminSupport: true
    });

    if (existingChat) {
        return existingChat;
    }

    // Create new admin support chat with just the user
    // Admins will be able to see and respond to all admin support chats
    const chat: IChat = await Chat.create({
        participants: [userId],
        isAdminSupport: true
    });

    return chat;
};

const getChatFromDB = async (
    user: JwtPayload,
    search: string
): Promise<any[]> => {
    // Build query to find chats where user is a participant
    const query: FilterQuery<IChat> = {
        participants: { $in: [user.id] },
    };

    // Populate only the other participants (not the current user)
    const chats = await Chat.find(query)
        .populate({
            path: 'participants',
            select: '_id fullName profilePicture email',
            match: { _id: { $ne: user.id } }
        })
        .populate({
            path: 'lastMessage',
            select: 'text image type createdAt sender'
        })
        .sort({ lastMessageAt: -1 }) // Sort by most recent message
        .select('participants status isAdminSupport lastMessage lastMessageAt')
        .lean();

    // Calculate unread count for each chat
    const chatsWithDetails = await Promise.all(
        chats.map(async (chat) => {
            const unreadCount = await Message.countDocuments({
                chatId: chat._id,
                sender: { $ne: new Types.ObjectId(user.id) },
                readBy: { $ne: new Types.ObjectId(user.id) }
            });

            return {
                ...chat,
                unreadCount
            };
        })
    );

    // Filter out chats where participants array is empty after filtering
    const filteredChats = chatsWithDetails.filter(
        chat => chat.participants.length > 0 || chat.isAdminSupport
    );

    return filteredChats;
};

// Get all admin support chats (for admin panel)
const getAdminSupportChats = async (): Promise<any[]> => {
    const chats = await Chat.find({ isAdminSupport: true })
        .populate({
            path: 'participants',
            select: '_id fullName profilePicture email'
        })
        .populate({
            path: 'lastMessage',
            select: 'text image type createdAt sender'
        })
        .sort({ lastMessageAt: -1 })
        .select('participants status isAdminSupport lastMessage lastMessageAt')
        .lean();

    // Calculate unread count for each chat (from user's perspective)
    const chatsWithUnreadCount = await Promise.all(
        chats.map(async (chat) => {
            // Count messages not sent by any admin (i.e., sent by the user)
            const unreadCount = await Message.countDocuments({
                chatId: chat._id,
                readBy: { $size: 1 } // Only read by sender (the user)
            });

            return {
                ...chat,
                unreadCount
            };
        })
    );

    return chatsWithUnreadCount;
};

// Delete a chat
const deleteChatFromDB = async (chatId: string, userId: string): Promise<void> => {
    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Chat not found');
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
        (p) => p.toString() === userId
    );

    if (!isParticipant) {
        throw new ApiError(
            StatusCodes.FORBIDDEN,
            'You are not authorized to delete this chat'
        );
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chatId });

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);
};

export const ChatService = {
    createChatToDB,
    createAdminSupportChat,
    getChatFromDB,
    getAdminSupportChats,
    deleteChatFromDB
};