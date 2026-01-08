import { Model, Types } from "mongoose";

export interface IPromotionPackage {
    title: string;
    productId: string;
    durationDays: number;
    price: number;
    description?: string;
    isActive: boolean;
}

export type PromotionPackageModel = Model<IPromotionPackage>;
