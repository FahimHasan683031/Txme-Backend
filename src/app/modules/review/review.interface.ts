import { Model, Types } from "mongoose";

export type IReview = {
    _id?: Types.ObjectId;
    customer: Types.ObjectId;
    vendor: Types.ObjectId;
    package: Types.ObjectId;
    comment: string;
    rating: number;
}

export type ReviewModel = Model<IReview>;