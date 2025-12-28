"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingService = void 0;
const mongoose_1 = require("mongoose");
const setting_model_1 = require("./setting.model");
const auditLog_service_1 = require("../auditLog/auditLog.service");
const getSetting = async () => {
    let setting = await setting_model_1.Setting.findOne();
    if (!setting) {
        // Create default settings if not exists
        setting = await setting_model_1.Setting.create({
            profilePromotion: { enabled: false, adminControlled: true },
            cardPayment: { enabled: false, adminControlled: true },
            sendInMessage: { enabled: false, adminControlled: true },
            digitalPayments: {
                enabled: true,
                paymentByCard: { enabled: false, adminControlled: true },
                paymentByPaypal: { enabled: false, adminControlled: true },
                paymentByWallet: {
                    enabled: false,
                    adminControlled: true,
                    walletFeatures: {
                        topUp: { enabled: false, adminControlled: true },
                        withdraw: { enabled: false, adminControlled: true },
                        moneyRequest: { enabled: false, adminControlled: true },
                        moneySend: { enabled: false, adminControlled: true }
                    }
                }
            }
        });
    }
    return setting;
};
const updateSetting = async (payload, userId) => {
    const oldSetting = await setting_model_1.Setting.findOne();
    // We update the only document in the collection
    const result = await setting_model_1.Setting.findOneAndUpdate({}, payload, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    });
    if (result) {
        await auditLog_service_1.AuditLogService.createLog({
            user: new mongoose_1.Types.ObjectId(userId),
            action: 'UPDATE_SETTING',
            details: `Settings updated by Admin (ID: ${userId})`
        });
    }
    return result;
};
exports.SettingService = {
    getSetting,
    updateSetting
};
