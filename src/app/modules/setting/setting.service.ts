import { Types } from 'mongoose';
import { ISetting } from './setting.interface';
import { Setting } from './setting.model';
import { AuditLogService } from '../auditLog/auditLog.service';

const getSetting = async (): Promise<ISetting> => {
    let setting = await Setting.findOne();
    if (!setting) {
        // Create default settings if not exists
        setting = await Setting.create({
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

const updateSetting = async (payload: Partial<ISetting>, userId: string): Promise<ISetting | null> => {
    const oldSetting = await Setting.findOne();

    // We update the only document in the collection
    const result = await Setting.findOneAndUpdate({}, payload, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
    });

    if (result) {
        await AuditLogService.createLog({
            user: new Types.ObjectId(userId),
            action: 'UPDATE_SETTING',
            details: `Settings updated by Admin (ID: ${userId})`
        });
    }

    return result;
};

export const SettingService = {
    getSetting,
    updateSetting
};
