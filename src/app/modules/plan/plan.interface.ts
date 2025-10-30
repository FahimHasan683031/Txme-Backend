import { Model } from "mongoose";

export type IPlan = {
    title: String;
    description: String;
    price: Number;
    duration: '1 month' | '3 months' | '6 months' | '1 year'; 
    paymentType: 'Monthly' | 'Yearly';
    productId?: String;
    paymentLink?: string;
    status: 'Active' | 'Delete'
}

export type PlanModel = Model<IPlan, Record<string, unknown>>;