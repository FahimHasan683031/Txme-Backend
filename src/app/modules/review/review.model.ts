import { model, Schema } from "mongoose";
import { IReview, ReviewModel } from "./review.interface";

const reviewSchema = new Schema<IReview, ReviewModel>(
    {
        customer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        vendor: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        package: {
            type: Schema.Types.ObjectId,
            ref: "Package",
            required: true,
        },
        comment: {
            type: String,
            required: true
        },
        rating: {
            type: Number,
            required: true
        },

    },
    { timestamps: true }
);

export const Review = model<IReview, ReviewModel>("Review", reviewSchema);