import { model, Schema } from 'mongoose';
import { ISetting, SettingModel } from './setting.interface';

const controlSchema = {
    enabled: { type: Boolean, default: false },
    adminControlled: { type: Boolean, default: true }
};

const settingSchema = new Schema<ISetting, SettingModel>(
    {
        profilePromotion: controlSchema,
        cardPayment: controlSchema,
        sendInMessage: controlSchema,
        digitalPayments: {
            enabled: { type: Boolean, default: true },
            paymentByCard: controlSchema,
            paymentByPaypal: controlSchema,
            paymentByWallet: {
                enabled: { type: Boolean, default: false },
                adminControlled: { type: Boolean, default: true },
                walletFeatures: {
                    topUp: controlSchema,
                    withdraw: controlSchema,
                    moneyRequest: controlSchema,
                    moneySend: controlSchema
                }
            }
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true
        }
    }
);

export const Setting = model<ISetting, SettingModel>('Setting', settingSchema);
