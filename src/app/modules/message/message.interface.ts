import { Model, Types } from 'mongoose';
import { MESSAGE } from '../../../enums/message';

export type IMessage = {
  _id?: Types.ObjectId;
  chatId: Types.ObjectId;
  sender: Types.ObjectId;
  text?: string;
  files?: string[];
  type: MESSAGE;
  readBy: Types.ObjectId[];
};

export type MessageModel = Model<IMessage, Record<string, unknown>>;
