// transaction.interface.ts
import { Types } from "mongoose";

export interface IWalletTransaction {
  wallet: Types.ObjectId;
  amount: number;
  type: "topup" | "withdraw" | "send";
  direction: "credit" | "debit";
  status: "pending" | "success" | "failed";
  reference?: string;
  from?: Types.ObjectId;
  to?: Types.ObjectId;
}
