import { Types } from 'mongoose';
import { ISetting } from './setting.interface';
import { Setting } from './setting.model';
import { AuditLogService } from '../auditLog/auditLog.service';
import { delCache, getCache, setCache } from '../../../helpers/redisHelper';

const getSetting = async (): Promise<ISetting> => {
    const cacheKey = "cache:settings:all";
    const cachedSetting = await getCache<ISetting>(cacheKey);
    if (cachedSetting) {
        return cachedSetting;
    }

    let setting = await Setting.findOne().lean();
    if (!setting) {
        // Create default settings if not exists
        const created = await Setting.create({
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
        setting = created.toObject();
    }

    await setCache(cacheKey, setting, 86400); // 24 Hours TTL
    return setting as ISetting;
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
        // Invalidate settings cache instantly
        await delCache("cache:settings:all");
    }

    return result;
};

export const SettingService = {
    getSetting,
    updateSetting
};
