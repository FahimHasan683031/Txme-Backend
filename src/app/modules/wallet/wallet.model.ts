// wallet.model.ts
import { Schema, model } from "mongoose";
import { IWallet } from "./wallet.interface";

const walletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Wallet = model<IWallet>("Wallet", walletSchema);
