import { StatusCodes } from "http-status-codes";
import ApiError from "../errors/ApiErrors";
import { Setting } from "../app/modules/setting/setting.model";

export const checkWalletSetting = async (feature?: 'topUp' | 'withdraw' | 'moneyRequest' | 'moneySend') => {
    const setting = await Setting.findOne();
    if (!setting) return;

    if (!setting.digitalPayments.enabled) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Digital payments are currently disabled by admin");
    }

    const wallet = setting.digitalPayments.paymentByWallet;
    if (!wallet.enabled) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Wallet system is currently disabled by admin");
    }

    if (feature) {
        const featureSetting = (wallet.walletFeatures as any)[feature];
        if (featureSetting && !featureSetting.enabled) {
            const formattedFeature = feature.replace(/([A-Z])/g, ' $1').toLowerCase();
            throw new ApiError(StatusCodes.FORBIDDEN, `Wallet ${formattedFeature} is currently disabled by admin`);
        }
    }
};

export const checkCardPaymentSetting = async () => {
    const setting = await Setting.findOne();
    if (!setting) return;

    if (!setting.digitalPayments.enabled) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Digital payments are currently disabled by admin");
    }

    if (!setting.digitalPayments.paymentByCard.enabled) {
        throw new ApiError(StatusCodes.FORBIDDEN, "Card payments are currently disabled by admin");
    }
};
