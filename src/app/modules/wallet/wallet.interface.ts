// wallet.interface.ts
import { Types } from "mongoose";

export interface IWallet {
  user: Types.ObjectId;
  balance: number;
  status: "active" | "blocked";
}
