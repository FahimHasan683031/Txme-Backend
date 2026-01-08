import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import { IPromotionPackage } from "./promotion.interface";
import { PromotionPackage } from "./promotion.model";
import { IapService } from "./iap.service";
import { User } from "../user/user.model";
import { WalletTransaction } from "../transaction/transaction.model";
import { Wallet } from "../wallet/wallet.model";

const getAllPackages = async () => {
    return await PromotionPackage.find({ isActive: true });
};

const getPackageByProductId = async (productId: string) => {
    const pkg = await PromotionPackage.findOne({ productId, isActive: true });
    if (!pkg) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Promotion package not found");
    }
    return pkg;
};

const verifyPurchase = async (userId: string, payload: { productId: string, receipt: string, platform: 'ios' | 'android' }) => {
    const { productId, receipt, platform } = payload;

    // 1. Verify receipt with Store API
    let verifiedData;
    if (platform === 'ios') {
        verifiedData = await IapService.verifyApplePurchase(receipt);
    } else {
        verifiedData = await IapService.verifyGooglePurchase(productId, receipt);
    }

    // Double check productId matches
    if (verifiedData.productId !== productId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Product ID mismatch");
    }

    // 2. Fetch the package to get duration
    const pkg = await getPackageByProductId(productId);

    // 3. Update User Promotion Status
    const user = await User.findById(userId);
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    const now = new Date();
    let newExpiry = new Date();

    // If already promoted and not expired, extend from current expiry
    if (user.isPromoted && user.promotionExpiry && user.promotionExpiry > now) {
        newExpiry = new Date(user.promotionExpiry.getTime());
    }

    newExpiry.setDate(newExpiry.getDate() + pkg.durationDays);

    user.isPromoted = true;
    user.promotionExpiry = newExpiry;
    await user.save();

    // 4. Log Transaction in unified History
    const userWallet = await Wallet.findOne({ user: userId });

    await WalletTransaction.create({
        wallet: userWallet?._id,
        user: userId, // Some implementations might use 'from'
        from: userId,
        amount: pkg.price || 0,
        type: 'promotion',
        direction: 'debit',
        status: 'success',
        reference: verifiedData.transactionId,
        platform: platform === 'ios' ? 'ios' : 'android',
        productId: productId
    });

    return user;
};

const createPackageToDB = async (payload: Partial<IPromotionPackage>) => {
    return await PromotionPackage.create(payload);
};

const updatePackageToDB = async (id: string, payload: Partial<IPromotionPackage>) => {
    const result = await PromotionPackage.findByIdAndUpdate(id, payload, { new: true });
    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Package not found");
    }
    return result;
};

const deletePackageFromDB = async (id: string) => {
    const result = await PromotionPackage.findByIdAndDelete(id);
    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Package not found");
    }
    return result;
};

export const PromotionService = {
    getAllPackages,
    getPackageByProductId,
    verifyPurchase,
    createPackageToDB,
    updatePackageToDB,
    deletePackageFromDB
};
