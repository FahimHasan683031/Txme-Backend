"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
// wallet.service.ts
const mongoose_1 = __importDefault(require("mongoose"));
const http_status_codes_1 = require("http-status-codes");
const wallet_model_1 = require("./wallet.model");
const transaction_model_1 = require("../transaction/transaction.model");
const stripe_service_1 = require("../stripe/stripe.service");
const user_model_1 = require("../user/user.model");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const notification_service_1 = require("../notification/notification.service");
const logger_1 = require("../../../shared/logger");
const mongoose_2 = require("mongoose");
const checkSetting_1 = require("../../../helpers/checkSetting");
const getOrCreateWallet = async (userId, session) => {
    let wallet = await wallet_model_1.Wallet.findOne({ user: userId }).session(session || null);
    if (!wallet) {
        const [newWallet] = await wallet_model_1.Wallet.create([{ user: userId }], { session });
        wallet = newWallet;
    }
    return wallet;
};
const getmyWallet = async (userId) => {
    const wallet = await getOrCreateWallet(userId);
    return wallet;
};
// TOP UP
const topUp = async (userId, amount, reference = "topup") => {
    if (amount <= 0) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Amount must be greater than zero");
    }
    await (0, checkSetting_1.checkWalletSetting)('topUp');
    console.log(`[WalletService] topUp called. User: ${userId}, Amount: ${amount}`);
    const user = await user_model_1.User.findById(userId);
    if (!user || user.status !== 'active') {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "User account is not active or not found");
    }
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const wallet = await getOrCreateWallet(userId, session);
        if (wallet.status === 'blocked') {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your wallet is blocked. Please contact support.");
        }
        const tx = await transaction_model_1.WalletTransaction.create([
            {
                wallet: wallet._id,
                amount,
                type: "topup",
                direction: "credit",
                status: "success",
                to: userId,
                reference: reference
            },
        ], { session });
        wallet.balance += amount;
        await wallet.save({ session });
        await session.commitTransaction();
        // Send Notification
        try {
            await notification_service_1.NotificationService.insertNotification({
                title: "Wallet Top Up",
                message: `Successfully added ${amount} to your wallet.`,
                receiver: new mongoose_2.Types.ObjectId(userId),
                screen: "WALLET",
                type: "USER",
                read: false
            });
        }
        catch (notificationError) {
            console.error('[WalletService] Failed to insert top-up notification:', notificationError);
        }
        return tx[0];
    }
    catch (e) {
        await session.abortTransaction();
        throw e;
    }
    finally {
        session.endSession();
    }
};
// SEND MONEY
const sendMoney = async (senderId, receiverIdentifier, amount) => {
    if (amount <= 0) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Amount must be greater than zero");
    }
    await (0, checkSetting_1.checkWalletSetting)('moneySend');
    console.log(`[WalletService] sendMoney: Sender: ${senderId}, Input: "${receiverIdentifier}", Amount: ${amount}`);
    // Determine lookup strategy: Priority ID -> Email -> Phone
    let receiver = null;
    if (mongoose_2.Types.ObjectId.isValid(receiverIdentifier)) {
        receiver = await user_model_1.User.findById(receiverIdentifier);
    }
    if (!receiver) {
        receiver = await user_model_1.User.findOne({
            $or: [
                { email: receiverIdentifier },
                { phone: receiverIdentifier }
            ]
        });
    }
    if (!receiver) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Receiver not found");
    }
    const receiverId = receiver._id;
    if (senderId === receiverId.toString()) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Cannot send money to yourself");
    }
    if (receiver.status !== 'active') {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Receiver account is ${receiver.status}.`);
    }
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const sender = await user_model_1.User.findById(senderId).session(session);
        if (!sender || sender.status !== 'active') {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your account is not active.");
        }
        const senderWallet = await getOrCreateWallet(senderId, session);
        const receiverWallet = await getOrCreateWallet(receiverId.toString(), session);
        if (senderWallet.status === 'blocked') {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your wallet is blocked.");
        }
        if (receiverWallet.status === 'blocked') {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Receiver's wallet is blocked.");
        }
        if (senderWallet.balance < amount) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Insufficient wallet balance");
        }
        // Perform transfer
        senderWallet.balance -= amount;
        receiverWallet.balance += amount;
        await senderWallet.save({ session });
        await receiverWallet.save({ session });
        const tx = await transaction_model_1.WalletTransaction.create([
            {
                wallet: senderWallet._id,
                amount,
                type: "send",
                direction: "debit",
                status: "success",
                from: senderId,
                to: receiverId,
            },
            {
                wallet: receiverWallet._id,
                amount,
                type: "send",
                direction: "credit",
                status: "success",
                from: senderId,
                to: receiverId,
            },
        ], { session, ordered: true });
        await session.commitTransaction();
        // Notifications
        try {
            await notification_service_1.NotificationService.insertNotification({
                title: "Money Sent",
                message: `You have successfully sent ${amount} to ${receiver.fullName || "User"}.`,
                receiver: new mongoose_2.Types.ObjectId(senderId),
                screen: "WALLET",
                type: "USER",
                read: false
            });
            await notification_service_1.NotificationService.insertNotification({
                title: "Money Received",
                message: `${sender.fullName || "Someone"} has sent you ${amount} in your wallet.`,
                receiver: receiverId,
                screen: "WALLET",
                type: "USER",
                read: false
            });
        }
        catch (notifError) {
            console.error('[WalletService] Notification error:', notifError);
        }
        return tx[0];
    }
    catch (e) {
        await session.abortTransaction();
        throw e;
    }
    finally {
        session.endSession();
    }
};
const withdraw = async (userId, amount) => {
    if (amount <= 0) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Amount must be greater than zero");
    }
    await (0, checkSetting_1.checkWalletSetting)('withdraw');
    const user = await user_model_1.User.findById(userId);
    if (!user || user.status !== 'active') {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "User account is not active or not found");
    }
    const wallet = await getOrCreateWallet(userId);
    if (wallet.status === 'blocked') {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "Your wallet is blocked.");
    }
    if (wallet.balance < amount) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Insufficient balance");
    }
    // Ensure user is connected to Stripe
    if (!user.isStripeConnected || !user.stripeAccountId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please connect your Stripe account to withdraw funds.");
    }
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // 1. Trigger Stripe Transfer (Platform -> Provider Account) FIRST to get reference
        const transfer = await stripe_service_1.StripeService.createTransfer(amount, user.stripeAccountId, { type: 'withdrawal', userId });
        // 2. Create successful transaction using Transfer ID as reference
        const tx = await transaction_model_1.WalletTransaction.create([
            {
                wallet: wallet._id,
                amount,
                type: "withdraw",
                direction: "debit",
                status: "success",
                from: userId,
                reference: transfer.id // Use Stripe Transfer ID
            }
        ], { session });
        // 3. Deduct from wallet balance
        wallet.balance -= amount;
        await wallet.save({ session });
        // 4. Trigger Stripe Payout (Provider Account -> Card/Bank)
        try {
            await stripe_service_1.StripeService.createPayout(amount, user.stripeAccountId);
        }
        catch (payoutError) {
            logger_1.logger.error(`Automatic payout failed for user ${userId}: ${payoutError}. The transfer was still successful.`);
        }
        await session.commitTransaction();
        // Notify User
        console.log(`[WalletService] Triggering withdrawal notification. User: ${userId}`);
        try {
            await notification_service_1.NotificationService.insertNotification({
                title: "Withdrawal Successful",
                message: `Your withdrawal of ${amount} has been successfully processed via Stripe.`,
                receiver: new mongoose_2.Types.ObjectId(userId),
                screen: "WALLET",
                type: "USER",
                read: false
            });
        }
        catch (notifError) {
            console.error(`[WalletService] Withdrawal notification failed:`, notifError);
        }
        return tx[0];
    }
    catch (error) {
        await session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
};
exports.WalletService = {
    getOrCreateWallet,
    topUp,
    sendMoney,
    withdraw,
    getmyWallet
};
