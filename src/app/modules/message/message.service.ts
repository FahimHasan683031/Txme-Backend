import mongoose from 'mongoose';
import QueryBuilder from '../../../helpers/QueryBuilder';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { checkMongooseIDValidation } from '../../../shared/checkMongooseIDValidation';
import { Chat } from '../chat/chat.model';
import { JwtPayload } from 'jsonwebtoken';

const sendMessageToDB = async (payload: any): Promise<IMessage> => {
  // Initialize readBy with sender's ID
  payload.readBy = [payload.sender];

  // Save to DB
  const response = await Message.create(payload);

  // Update chat's lastMessage and lastMessageAt
  await Chat.findByIdAndUpdate(payload.chatId, {
    lastMessage: response._id,
    lastMessageAt: new Date()
  });

  //@ts-ignore
  const io = global.io;
  if (io && payload.chatId) {
    // Send message to specific Chat room
    io.emit(`getMessage::${payload?.chatId}`, response);
  }

  return response;
};

// Get Message from db
const getMessageFromDB = async (
  id: string,
  user: JwtPayload,
  query: Record<string, any>
): Promise<{ messages: IMessage[], pagination: any, participant: any }> => {
  checkMongooseIDValidation(id, "Chat");

  const result = new QueryBuilder(
    Message.find({ chatId: id }).sort({ createdAt: 1 }),
    query
  ).paginate();

  const messages = await result.modelQuery;
  const pagination = await result.getPaginationInfo();

  const participant = await Chat.findById(id).populate({
    path: 'participants',
    select: '-_id name profile',
    match: {
      _id: { $ne: new mongoose.Types.ObjectId(user.id) }
    }
  });

  return { messages, pagination, participant: participant?.participants[0] };
};

// Mark messages as read
const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
  checkMongooseIDValidation(chatId, "Chat");

  // Update all messages in the chat that haven't been read by this user
  await Message.updateMany(
    {
      chatId: new mongoose.Types.ObjectId(chatId),
      sender: { $ne: new mongoose.Types.ObjectId(userId) },
      readBy: { $ne: new mongoose.Types.ObjectId(userId) }
    },
    {
      $addToSet: { readBy: new mongoose.Types.ObjectId(userId) }
    }
  );
};

// Get unread message count for a specific chat
const getUnreadCountForChat = async (chatId: string, userId: string): Promise<number> => {
  const count = await Message.countDocuments({
    chatId: new mongoose.Types.ObjectId(chatId),
    sender: { $ne: new mongoose.Types.ObjectId(userId) },
    readBy: { $ne: new mongoose.Types.ObjectId(userId) }
  });

  return count;
};

// Get total unread message count for a user
const getTotalUnreadCount = async (userId: string): Promise<number> => {
  // Get all chats for this user
  const chats = await Chat.find({
    participants: new mongoose.Types.ObjectId(userId)
  }).select('_id');

  const chatIds = chats.map(chat => chat._id);

  // Count unread messages across all chats
  const count = await Message.countDocuments({
    chatId: { $in: chatIds },
    sender: { $ne: new mongoose.Types.ObjectId(userId) },
    readBy: { $ne: new mongoose.Types.ObjectId(userId) }
  });

  return count;
};

export const MessageService = {
  sendMessageToDB,
  getMessageFromDB,
  markMessagesAsRead,
  getUnreadCountForChat,
  getTotalUnreadCount
};