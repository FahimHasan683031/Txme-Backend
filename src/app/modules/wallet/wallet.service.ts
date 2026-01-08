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

const getOrCreateWallet = async (userId: string) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId });
  }
  return wallet;
};

const getmyWallet = async (userId: string) => {
  const wallet = await getOrCreateWallet(userId);
  return wallet;
};

// TOP UP
// TOP UP
const topUp = async (userId: string, amount: number, reference: string = "topup") => {
  await checkWalletSetting('topUp');
  console.log(`[WalletService] topUp called. User: ${userId}, Amount: ${amount}`);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await getOrCreateWallet(userId);
    console.log(`[WalletService] Wallet found/created: ${wallet._id}`);

    const tx = await WalletTransaction.create(
      [
        {
          wallet: wallet._id,
          amount,
          type: "topup",
          direction: "credit",
          status: "success",
          to: userId,
          reference: reference // Use the passed reference
        },
      ],
      { session, ordered: true }
    );
    console.log(`[WalletService] Transaction record created: ${tx[0]?._id}`);

    wallet.balance += amount;
    await wallet.save({ session });
    console.log(`[WalletService] Wallet balance updated.`);

    await session.commitTransaction();
    console.log('[WalletService] Transaction committed.');

    // Send Notification
    console.log(`[WalletService] Triggering notification for Top Up. User: ${userId}, Amount: ${amount}`);
    try {
      const notification = await NotificationService.insertNotification({
        title: "Wallet Top Up",
        message: `Successfully added ${amount} to your wallet.`,
        receiver: new Types.ObjectId(userId),
        screen: "WALLET",
        type: "USER",
        read: false
      });
      console.log(`[WalletService] Notification inserted successfully`);
    } catch (notificationError) {
      console.error('[WalletService] Failed to insert top-up notification:', notificationError);
    }

    return tx[0];
  } catch (e) {
    console.error('[WalletService] topUp failed:', e);
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
  await checkWalletSetting('moneySend');
  // Use Promise.all for finding user by ID, email or phone
  const [userById, userByEmail, userByPhone] = await Promise.all([
    Types.ObjectId.isValid(receiverIdentifier)
      ? User.findById(receiverIdentifier)
      : Promise.resolve(null),
    User.findOne({ email: receiverIdentifier }),
    User.findOne({ phone: receiverIdentifier }),
  ]);

  const receiver = userById || userByEmail || userByPhone;

  if (!receiver) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Receiver not found");
  }

  const receiverId = receiver._id.toString();

  if (senderId === receiverId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cannot send to self");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Sender not found");
    }

    const senderWallet = await getOrCreateWallet(senderId);
    const receiverWallet = await getOrCreateWallet(receiverId);

    if (senderWallet.balance < amount) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient balance");
    }

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

    // Notify Sender
    await NotificationService.insertNotification({
      title: "Money Sent",
      message: `You have successfully sent ${amount} to ${receiver.fullName || "User"}.`,
      receiver: new Types.ObjectId(senderId),
      screen: "WALLET",
      type: "USER",
      read: false
    });

    // Notify Receiver
    await NotificationService.insertNotification({
      title: "Money Received",
      message: `${sender.fullName || "Someone"} has sent you ${amount} in your wallet.`,
      receiver: receiver._id,
      screen: "WALLET",
      type: "USER",
      read: false
    });

    return tx[0];
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

const withdraw = async (userId: string, amount: number) => {
  await checkWalletSetting('withdraw');
  const wallet = await getOrCreateWallet(userId);

  if (wallet.balance < amount) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient balance");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

  // Ensure user is connected to Stripe
  if (!user.isStripeConnected || !user.stripeAccountId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Please connect your Stripe account to withdraw funds.");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

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
