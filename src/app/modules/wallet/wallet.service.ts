// wallet.service.ts
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Wallet } from "./wallet.model";
import { WalletTransaction } from "../transaction/transaction.model";
import { StripeService } from "../stripe/stripe.service";
import { User } from "../user/user.model";
import ApiError from "../../../errors/ApiErrors";
import { NotificationService } from "../notification/notification.service";
import { logger } from "../../../shared/logger";
import { Types } from "mongoose";
import { checkWalletSetting } from "../../../helpers/checkSetting";

const getOrCreateWallet = async (userId: string, session?: mongoose.ClientSession) => {
  let wallet = await Wallet.findOne({ user: userId }).session(session || null);
  if (!wallet) {
    const [newWallet] = await Wallet.create([{ user: userId }], { session });
    wallet = newWallet;
  }
  return wallet;
};

const getmyWallet = async (userId: string) => {
  const wallet = await getOrCreateWallet(userId);
  return wallet;
};

// TOP UP
const topUp = async (userId: string, amount: number, reference: string = "topup") => {
  if (amount <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Amount must be greater than zero");
  }

  await checkWalletSetting('topUp');
  console.log(`[WalletService] topUp called. User: ${userId}, Amount: ${amount}`);

  const user = await User.findById(userId);
  if (!user || user.status !== 'active') {
    throw new ApiError(StatusCodes.FORBIDDEN, "User account is not active or not found");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await getOrCreateWallet(userId, session);

    if (wallet.status === 'blocked') {
      throw new ApiError(StatusCodes.FORBIDDEN, "Your wallet is blocked. Please contact support.");
    }

    const tx = await WalletTransaction.create(
      [
        {
          wallet: wallet._id,
          amount,
          type: "topup",
          direction: "credit",
          status: "success",
          to: userId,
          reference: reference
        },
      ],
      { session }
    );

    wallet.balance += amount;
    await wallet.save({ session });

    await session.commitTransaction();

    // Send Notification
    try {
      await NotificationService.insertNotification({
        title: "Wallet Top Up",
        message: `Successfully added ${amount} to your wallet.`,
        receiver: new Types.ObjectId(userId),
        screen: "WALLET",
        type: "USER",
        read: false
      });
    } catch (notificationError) {
      console.error('[WalletService] Failed to insert top-up notification:', notificationError);
    }

    return tx[0];
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

// SEND MONEY
const sendMoney = async (
  senderId: string,
  receiverIdentifier: string,
  amount: number
) => {
  if (amount <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Amount must be greater than zero");
  }

  await checkWalletSetting('moneySend');

  console.log(`[WalletService] sendMoney: Sender: ${senderId}, Input: "${receiverIdentifier}", Amount: ${amount}`);

  // Determine lookup strategy: Priority ID -> Email -> Phone
  let receiver = null;

  if (Types.ObjectId.isValid(receiverIdentifier)) {
    receiver = await User.findById(receiverIdentifier);
  }

  if (!receiver) {
    receiver = await User.findOne({
      $or: [
        { email: receiverIdentifier },
        { phone: receiverIdentifier }
      ]
    });
  }

  if (!receiver) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Receiver not found");
  }

  const receiverId = receiver._id;

  if (senderId === receiverId.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cannot send money to yourself");
  }

  if (receiver.status !== 'active') {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Receiver account is ${receiver.status}.`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await User.findById(senderId).session(session);
    if (!sender || sender.status !== 'active') {
      throw new ApiError(StatusCodes.FORBIDDEN, "Your account is not active.");
    }

    const senderWallet = await getOrCreateWallet(senderId, session);
    const receiverWallet = await getOrCreateWallet(receiverId.toString(), session);

    if (senderWallet.status === 'blocked') {
      throw new ApiError(StatusCodes.FORBIDDEN, "Your wallet is blocked.");
    }
    if (receiverWallet.status === 'blocked') {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Receiver's wallet is blocked.");
    }

    if (senderWallet.balance < amount) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient wallet balance");
    }

    // Perform transfer
    senderWallet.balance -= amount;
    receiverWallet.balance += amount;

    await senderWallet.save({ session });
    await receiverWallet.save({ session });

    const tx = await WalletTransaction.create(
      [
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
      ],
      { session, ordered: true }
    );

    await session.commitTransaction();

    // Notifications
    try {
      await NotificationService.insertNotification({
        title: "Money Sent",
        message: `You have successfully sent ${amount} to ${receiver.fullName || "User"}.`,
        receiver: new Types.ObjectId(senderId),
        screen: "WALLET",
        type: "USER",
        read: false
      });

      await NotificationService.insertNotification({
        title: "Money Received",
        message: `${sender.fullName || "Someone"} has sent you ${amount} in your wallet.`,
        receiver: receiverId,
        screen: "WALLET",
        type: "USER",
        read: false
      });
    } catch (notifError) {
      console.error('[WalletService] Notification error:', notifError);
    }

    return tx[0];
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

const withdraw = async (userId: string, amount: number) => {
  if (amount <= 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Amount must be greater than zero");
  }

  await checkWalletSetting('withdraw');

  const user = await User.findById(userId);
  if (!user || user.status !== 'active') {
    throw new ApiError(StatusCodes.FORBIDDEN, "User account is not active or not found");
  }

  const wallet = await getOrCreateWallet(userId);
  if (wallet.status === 'blocked') {
    throw new ApiError(StatusCodes.FORBIDDEN, "Your wallet is blocked.");
  }

  if (wallet.balance < amount) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient balance");
  }

  // Ensure user is connected to Stripe
  if (!user.isStripeConnected || !user.stripeAccountId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Please connect your Stripe account to withdraw funds.");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {

    // 1. Trigger Stripe Transfer (Platform -> Provider Account) FIRST to get reference
    const transfer = await StripeService.createTransfer(amount, user.stripeAccountId, { type: 'withdrawal', userId });

    // 2. Create successful transaction using Transfer ID as reference
    const tx = await WalletTransaction.create([
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
      await StripeService.createPayout(amount, user.stripeAccountId);
    } catch (payoutError) {
      logger.error(`Automatic payout failed for user ${userId}: ${payoutError}. The transfer was still successful.`);
    }

    await session.commitTransaction();

    // Notify User
    console.log(`[WalletService] Triggering withdrawal notification. User: ${userId}`);
    try {
      await NotificationService.insertNotification({
        title: "Withdrawal Successful",
        message: `Your withdrawal of ${amount} has been successfully processed via Stripe.`,
        receiver: new Types.ObjectId(userId),
        screen: "WALLET",
        type: "USER",
        read: false
      });
    } catch (notifError) {
      console.error(`[WalletService] Withdrawal notification failed:`, notifError);
    }

    return tx[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const WalletService = {
  getOrCreateWallet,
  topUp,
  sendMoney,
  withdraw,
  getmyWallet
};
