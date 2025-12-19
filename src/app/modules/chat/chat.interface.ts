import { Model, Types } from 'mongoose';

export type IChat = {
    _id?: Types.ObjectId;
    participants: Types.ObjectId[];
    isAdminSupport: boolean; // Flag to identify admin support chats
    lastMessage?: Types.ObjectId; // Reference to last message
    lastMessageAt?: Date; // Timestamp of last message
    status: boolean;
}

export type ChatModel = Model<IChat, Record<string, unknown>>;