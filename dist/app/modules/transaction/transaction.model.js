"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletTransaction = void 0;
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    wallet: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    from: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    to: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
exports.WalletTransaction = (0, mongoose_1.model)("WalletTransaction", transactionSchema);
