import { Types } from "mongoose";

export interface IService {
  _id: Types.ObjectId;
  name: string;
  image: string;
  parent: Types.ObjectId | null;
  isActive: boolean;
}
