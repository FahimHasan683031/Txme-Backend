import { Model, Types } from 'mongoose';

export type ISubscription = {
    _id?:string;
    customerId: string;
    price: number;
    vendor: Types.ObjectId;
    plan: Types.ObjectId;
    trxId: string;
    subscriptionId: string;
    status: 'expired' | 'active' | 'cancel';
    currentPeriodStart: string;
    currentPeriodEnd: string;
};

export type SubscriptionModel = Model<ISubscription, Record<string, unknown>>;