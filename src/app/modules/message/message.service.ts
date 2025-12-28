import mongoose from 'mongoose';
import QueryBuilder from '../../../helpers/QueryBuilder';
import { IMessage } from './message.interface';
import { Message } from './message.model';
import { checkMongooseIDValidation } from '../../../shared/checkMongooseIDValidation';
import { Chat } from '../chat/chat.model';
import { WalletService } from '../wallet/wallet.service';
import { MESSAGE } from '../../../enums/message';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { checkWalletSetting } from '../../../helpers/checkSetting';

const sendMessageToDB = async (payload: any): Promise<IMessage> => {
  // Initialize readBy with sender's ID
  payload.readBy = [payload.sender];

  if (payload.type === MESSAGE.MoneyRequest) {
    await checkWalletSetting('moneyRequest');
    if (!payload.amount || payload.amount <= 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Amount is required for money requests and must be greater than 0");
    }
    payload.moneyRequestStatus = 'pending';
  }

  const isExistChat = await Chat.findById(payload.chatId);
  if (!isExistChat) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Chat doesn't exist!");
  }

  if (!isExistChat.participants.includes(payload.sender)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You are not a participant!");
  }

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

    // Notify ALL participants to update their chat list (real-time sorting)
    isExistChat.participants.forEach((participantId: any) => {
      io.emit(`chatListUpdate::${participantId.toString()}`, {
        chatId: payload.chatId,
        lastMessage: response,
      });
    });
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

  const isExistChat = await Chat.findById(id);
  if (!isExistChat) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Chat doesn't exist!");
  }

  if (!isExistChat.participants.includes(user.id) && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('You are not participant of this chat')
  }

  // Mark messages as read for this user
  await Message.updateMany(
    {
      chatId: new mongoose.Types.ObjectId(id),
      sender: { $ne: new mongoose.Types.ObjectId(user.id) },
      readBy: { $ne: new mongoose.Types.ObjectId(user.id) }
    },
    {
      $addToSet: { readBy: new mongoose.Types.ObjectId(user.id) }
    }
  );

  const result = new QueryBuilder(
    Message.find({ chatId: id })
      .populate('sender', 'fullName profilePicture')
      .sort({ createdAt: 1 }),
    query
  ).paginate();

  const messages = await result.modelQuery;
  const pagination = await result.getPaginationInfo();

  const participant = await Chat.findById(id).populate({
    path: 'participants',
    select: '-_id fullName profilePicture ',
    match: {
      _id: { $ne: new mongoose.Types.ObjectId(user.id) }
    }
  });

  return { messages, pagination, participant: participant?.participants[0] };
};


// Update a message
const updateMessageToDB = async (messageId: string, userId: string, payload: Partial<IMessage>): Promise<IMessage | null> => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
  }

  // Check if the user is the sender
  if (message.sender.toString() !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only update your own messages");
  }

  // Update the message
  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    payload,
    { new: true }
  );

  return updatedMessage;
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

// Delete message from DB
const deleteMessageFromDB = async (messageId: string, userId: string): Promise<IMessage | null> => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
  }

  // Check if the user is the sender of the message
  if (message.sender.toString() !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You can only delete your own messages");
  }

  return await Message.findByIdAndDelete(messageId);
};

const updateMoneyRequestStatusToDB = async (messageId: string, user: JwtPayload, status: 'accepted' | 'rejected') => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Message not found");
  }

  if (message.type !== MESSAGE.MoneyRequest) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Message is not a money request");
  }

  if (message.moneyRequestStatus !== 'pending') {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Money request is already ${message.moneyRequestStatus}`);
  }

  // The sender is the one who REQUESTED money. The participant (current user) is the one who ACCEPTS/REJECTS.
  if (message.sender.toString() === user.id) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You cannot accept/reject your own money request");
  }

  if (status === 'accepted') {
    await checkWalletSetting('moneyRequest');
    if (!message.amount) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid money request: amount missing");
    }

    // Transfer money from the current user (acceptor) to the message sender (requester)
    await WalletService.sendMoney(user.id, message.sender.toString(), message.amount);
  }

  message.moneyRequestStatus = status;
  await message.save();

  // Socket notification for real-time update in chat UI
  //@ts-ignore
  const io = global.io;
  if (io) {
    io.emit(`moneyRequestUpdate::${message.chatId}`, message);

    // Also update chat list for participants (move to top)
    const chat = await Chat.findById(message.chatId);
    if (chat) {
      chat.participants.forEach((participantId: any) => {
        io.emit(`chatListUpdate::${participantId.toString()}`, {
          chatId: message.chatId,
          lastMessageAt: new Date(),
        });
      });
    }
  }

  return message;
};

export const MessageService = {
  sendMessageToDB,
  getMessageFromDB,
  updateMessageToDB,
  getUnreadCountForChat,
  getTotalUnreadCount,
  deleteMessageFromDB,
  updateMoneyRequestStatusToDB
};