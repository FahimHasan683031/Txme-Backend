import { Schema, model } from "mongoose";
import { ISupport, SupportModel } from "./support.interface";

const SupportSchema = new Schema<ISupport>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String,
            required: true
        }
    },
    { timestamps: true }
);

export const Support = model<ISupport, SupportModel>("Support", SupportSchema);