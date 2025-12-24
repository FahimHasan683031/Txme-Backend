import { Model } from 'mongoose';

export type ISetting = {
    profilePromotion: {
        enabled: boolean;
        adminControlled: boolean;
    };
    cardPayment: {
        enabled: boolean;
        adminControlled: boolean;
    };
    sendInMessage: {
        enabled: boolean;
        adminControlled: boolean;
    };
    digitalPayments: {
        enabled: boolean;
        paymentByCard: {
            enabled: boolean;
            adminControlled: boolean;
        };
        paymentByPaypal: {
            enabled: boolean;
            adminControlled: boolean;
        };
        paymentByWallet: {
            enabled: boolean;
            adminControlled: boolean;
            walletFeatures: {
                topUp: {
                    enabled: boolean;
                    adminControlled: boolean;
                };
                withdraw: {
                    enabled: boolean;
                    adminControlled: boolean;
                };
                moneyRequest: {
                    enabled: boolean;
                    adminControlled: boolean;
                };
                moneySend: {
                    enabled: boolean;
                    adminControlled: boolean;
                };
            };
        };
    };
};

export type SettingModel = Model<ISetting>;
