"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Setting = void 0;
const mongoose_1 = require("mongoose");
const controlSchema = {
    enabled: { type: Boolean, default: false },
    adminControlled: { type: Boolean, default: true }
};
const settingSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});
exports.Setting = (0, mongoose_1.model)('Setting', settingSchema);
