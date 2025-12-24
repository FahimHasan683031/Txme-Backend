// wallet.service.ts
import mongoose from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Wallet } from "./wallet.model";
import { WalletTransaction } from "../transaction/transaction.model";
import ApiError from "../../../errors/ApiErrors";
import { NotificationService } from "../notification/notification.service";
import { Types } from "mongoose";

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
const topUp = async (userId: string, amount: number) => {
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
    await NotificationService.insertNotification({
      title: "Wallet Top Up",
      message: `Successfully added ${amount} to your wallet.`,
      receiver: new Types.ObjectId(userId),
      screen: "WALLET",
      type: "USER",
      read: false
    });

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
  receiverId: string,
  amount: number
) => {
  if (senderId === receiverId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cannot send to self");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderWallet = await getOrCreateWallet(senderId);
    const receiverWallet = await getOrCreateWallet(receiverId);

    if (senderWallet.balance < amount) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient balance");
    }

    senderWallet.balance -= amount;
    receiverWallet.balance += amount;

    await senderWallet.save({ session });
    await receiverWallet.save({ session });

    await WalletTransaction.create(
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

    // Notify Receiver
    await NotificationService.insertNotification({
      title: "Money Received",
      message: `You have received ${amount} in your wallet.`,
      receiver: new Types.ObjectId(receiverId),
      screen: "WALLET",
      type: "USER",
      read: false
    });

    return true;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

// WITHDRAW
const withdraw = async (userId: string, amount: number) => {
  const wallet = await getOrCreateWallet(userId);

  if (wallet.balance < amount) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Insufficient balance");
  }

  const tx = await WalletTransaction.create({
    wallet: wallet._id,
    amount,
    type: "withdraw",
    direction: "debit",
    status: "pending",
    from: userId,
  });

  return tx;
};

export const WalletService = {
  getOrCreateWallet,
  topUp,
  sendMoney,
  withdraw,
  getmyWallet
};
