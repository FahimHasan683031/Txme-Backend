import { Types } from "mongoose";

export interface IReview {
  reviewer: Types.ObjectId;
  reviewee: Types.ObjectId;
  service: string;
  appointment: Types.ObjectId;
  rating: number;
  comment?: string;
}
