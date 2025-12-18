// transaction.model.ts
import { Schema, model } from "mongoose";
import { IWalletTransaction } from "./transaction.interface";

const transactionSchema = new Schema<IWalletTransaction>(
  {
    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["topup", "withdraw", "send"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    reference: String,
    from: { type: Schema.Types.ObjectId, ref: "User" },
    to: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const WalletTransaction = model<IWalletTransaction>(
  "WalletTransaction",
  transactionSchema
);
