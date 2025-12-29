"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCardPaymentSetting = exports.checkWalletSetting = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const setting_model_1 = require("../app/modules/setting/setting.model");
const checkWalletSetting = async (feature) => {
    const setting = await setting_model_1.Setting.findOne();
    if (!setting)
        return;
    if (!setting.digitalPayments.enabled) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Digital payments are currently disabled by admin");
    }
    const wallet = setting.digitalPayments.paymentByWallet;
    if (!wallet.enabled) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Wallet system is currently disabled by admin");
    }
    if (feature) {
        const featureSetting = wallet.walletFeatures[feature];
        if (featureSetting && !featureSetting.enabled) {
            const formattedFeature = feature.replace(/([A-Z])/g, ' $1').toLowerCase();
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, `Wallet ${formattedFeature} is currently disabled by admin`);
        }
    }
};
exports.checkWalletSetting = checkWalletSetting;
const checkCardPaymentSetting = async () => {
    const setting = await setting_model_1.Setting.findOne();
    if (!setting)
        return;
    if (!setting.digitalPayments.enabled) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Digital payments are currently disabled by admin");
    }
    if (!setting.digitalPayments.paymentByCard.enabled) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Card payments are currently disabled by admin");
    }
};
exports.checkCardPaymentSetting = checkCardPaymentSetting;
