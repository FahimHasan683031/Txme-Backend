import { model, Schema } from "mongoose";
import { IPromotionPackage, PromotionPackageModel } from "./promotion.interface";

const promotionPackageSchema = new Schema<IPromotionPackage>(
    {
        title: { type: String, required: true },
        productId: { type: String, required: true, unique: true },
        durationDays: { type: Number, required: true },
        price: { type: Number, required: true },
        description: { type: String },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

export const PromotionPackage = model<IPromotionPackage, PromotionPackageModel>(
    "PromotionPackage",
    promotionPackageSchema
);
