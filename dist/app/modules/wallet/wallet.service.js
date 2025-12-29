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
const getOrCreateWallet = async (userId) => {
    let wallet = await wallet_model_1.Wallet.findOne({ user: userId });
    if (!wallet) {
        wallet = await wallet_model_1.Wallet.create({ user: userId });
    }
    return wallet;
};
const getmyWallet = async (userId) => {
    const wallet = await getOrCreateWallet(userId);
    return wallet;
};
// TOP UP
const topUp = async (userId, amount) => {
    var _a;
    await (0, checkSetting_1.checkWalletSetting)('topUp');
    console.log(`[WalletService] topUp called. User: ${userId}, Amount: ${amount}`);
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const wallet = await getOrCreateWallet(userId);
        console.log(`[WalletService] Wallet found/created: ${wallet._id}`);
        const tx = await transaction_model_1.WalletTransaction.create([
            {
                wallet: wallet._id,
                amount,
                type: "topup",
                direction: "credit",
                status: "success",
                to: userId,
            },
        ], { session, ordered: true });
        console.log(`[WalletService] Transaction record created: ${(_a = tx[0]) === null || _a === void 0 ? void 0 : _a._id}`);
        wallet.balance += amount;
        await wallet.save({ session });
        console.log(`[WalletService] Wallet balance updated.`);
        await session.commitTransaction();
        console.log('[WalletService] Transaction committed.');
        // Send Notification
        await notification_service_1.NotificationService.insertNotification({
            title: "Wallet Top Up",
            message: `Successfully added ${amount} to your wallet.`,
            receiver: new mongoose_2.Types.ObjectId(userId),
            screen: "WALLET",
            type: "USER",
            read: false
        });
        return tx[0];
    }
    catch (e) {
        console.error('[WalletService] topUp failed:', e);
        await session.abortTransaction();
        throw e;
    }
    finally {
        session.endSession();
    }
};
// SEND MONEY
const sendMoney = async (senderId, receiverIdentifier, amount) => {
    await (0, checkSetting_1.checkWalletSetting)('moneySend');
    // Use Promise.all for finding user by ID, email or phone
    const [userById, userByEmail, userByPhone] = await Promise.all([
        mongoose_2.Types.ObjectId.isValid(receiverIdentifier)
            ? user_model_1.User.findById(receiverIdentifier)
            : Promise.resolve(null),
        user_model_1.User.findOne({ email: receiverIdentifier }),
        user_model_1.User.findOne({ phone: receiverIdentifier }),
    ]);
    const receiver = userById || userByEmail || userByPhone;
    if (!receiver) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Receiver not found");
    }
    const receiverId = receiver._id.toString();
    if (senderId === receiverId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Cannot send to self");
    }
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const sender = await user_model_1.User.findById(senderId);
        if (!sender) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Sender not found");
        }
        const senderWallet = await getOrCreateWallet(senderId);
        const receiverWallet = await getOrCreateWallet(receiverId);
        if (senderWallet.balance < amount) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Insufficient balance");
        }
        senderWallet.balance -= amount;
        receiverWallet.balance += amount;
        await senderWallet.save({ session });
        await receiverWallet.save({ session });
        await transaction_model_1.WalletTransaction.create([
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
        // Notify Sender
        await notification_service_1.NotificationService.insertNotification({
            title: "Money Sent",
            message: `You have successfully sent ${amount} to ${receiver.fullName || "User"}.`,
            receiver: new mongoose_2.Types.ObjectId(senderId),
            screen: "WALLET",
            type: "USER",
            read: false
        });
        // Notify Receiver
        await notification_service_1.NotificationService.insertNotification({
            title: "Money Received",
            message: `${sender.fullName || "Someone"} has sent you ${amount} in your wallet.`,
            receiver: receiver._id,
            screen: "WALLET",
            type: "USER",
            read: false
        });
        return true;
    }
    catch (e) {
        await session.abortTransaction();
        throw e;
    }
    finally {
        session.endSession();
    }
};
// WITHDRAW
const withdraw = async (userId, amount) => {
    await (0, checkSetting_1.checkWalletSetting)('withdraw');
    const wallet = await getOrCreateWallet(userId);
    if (wallet.balance < amount) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Insufficient balance");
    }
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    // If user is connected to Stripe, proceed with automated withdrawal
    if (user.isStripeConnected && user.stripeAccountId) {
        const session = await mongoose_1.default.startSession();
        try {
            session.startTransaction();
            // 1. Create successful transaction
            const tx = await transaction_model_1.WalletTransaction.create([
                {
                    wallet: wallet._id,
                    amount,
                    type: "withdraw",
                    direction: "debit",
                    status: "success",
                    from: userId,
                    reference: "Stripe Automated Withdrawal"
                }
            ], { session });
            // 2. Deduct from wallet balance
            wallet.balance -= amount;
            await wallet.save({ session });
            // 3. Trigger Stripe Transfer (Platform -> Provider Account)
            await stripe_service_1.StripeService.createTransfer(amount, user.stripeAccountId, { type: 'withdrawal', userId });
            // 4. Trigger Stripe Payout (Provider Account -> Card/Bank)
            // Note: This requires the connected account to have enough balance. 
            // If we just transferred it, it might take a moment to be available.
            // We'll attempt a payout.
            try {
                await stripe_service_1.StripeService.createPayout(amount, user.stripeAccountId);
            }
            catch (payoutError) {
                logger_1.logger.error(`Automatic payout failed for user ${userId}: ${payoutError}. The transfer was still successful.`);
            }
            await session.commitTransaction();
            // Notify User (Successful)
            await notification_service_1.NotificationService.insertNotification({
                title: "Withdrawal Successful",
                message: `Your withdrawal of ${amount} has been successfully processed via Stripe.`,
                receiver: new mongoose_2.Types.ObjectId(userId),
                screen: "WALLET",
                type: "USER",
                read: false
            });
            return tx[0];
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    // Fallback: Manual withdrawal (just create pending transaction)
    const tx = await transaction_model_1.WalletTransaction.create({
        wallet: wallet._id,
        amount,
        type: "withdraw",
        direction: "debit",
        status: "pending",
        from: userId,
    });
    // Notify User (Pending)
    await notification_service_1.NotificationService.insertNotification({
        title: "Withdrawal Requested",
        message: `Your request to withdraw ${amount} is pending approval from the admin.`,
        receiver: new mongoose_2.Types.ObjectId(userId),
        screen: "WALLET",
        type: "USER",
        read: false
    });
    return tx;
};
exports.WalletService = {
    getOrCreateWallet,
    topUp,
    sendMoney,
    withdraw,
    getmyWallet
};
