"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const transaction_model_1 = require("./transaction.model");
const wallet_model_1 = require("../wallet/wallet.model");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const getAllTransactionsFromDB = async (query) => {
    const transactionQuery = new QueryBuilder_1.default(transaction_model_1.WalletTransaction.find()
        .populate("wallet", "balance")
        .populate("from", "fullName profilePicture email")
        .populate("to", "fullName profilePicture email"), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = await transactionQuery.modelQuery;
    const meta = await transactionQuery.getPaginationInfo();
    return { result, meta };
};
const getMyTransactionsFromDB = async (user, query) => {
    const { id } = user;
    // Find user's wallet
    const wallet = await wallet_model_1.Wallet.findOne({ user: id });
    if (!wallet) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found for this user");
    }
    // Filter by user's wallet ID
    query.wallet = wallet._id.toString();
    const transactionQuery = new QueryBuilder_1.default(transaction_model_1.WalletTransaction.find()
        .populate("wallet", "balance")
        .populate("from", "fullName profilePicture email")
        .populate("to", "fullName profilePicture email"), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = await transactionQuery.modelQuery;
    const meta = await transactionQuery.getPaginationInfo();
    return { result, meta };
};
exports.TransactionService = {
    getAllTransactionsFromDB,
    getMyTransactionsFromDB,
};
