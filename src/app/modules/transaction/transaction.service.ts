import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../../../helpers/QueryBuilder";
import { WalletTransaction } from "./transaction.model";
import { Wallet } from "../wallet/wallet.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";

const getAllTransactionsFromDB = async (query: Record<string, any>) => {
    const transactionQuery = new QueryBuilder(
        WalletTransaction.find()
            .populate("wallet", "balance")
            .populate("from", "fullName profilePicture email")
            .populate("to", "fullName profilePicture email"),
        query
    )
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await transactionQuery.modelQuery;
    const meta = await transactionQuery.getPaginationInfo();

    return { result, meta };
};

const getMyTransactionsFromDB = async (user: JwtPayload, query: Record<string, any>) => {
    const { id } = user;

    // Find user's wallet
    const wallet = await Wallet.findOne({ user: id });
    if (!wallet) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Wallet not found for this user");
    }

    // Filter by user's wallet ID
    query.wallet = wallet._id.toString();

    const transactionQuery = new QueryBuilder(
        WalletTransaction.find()
            .populate("wallet", "balance")
            .populate("from", "fullName profilePicture email")
            .populate("to", "fullName profilePicture email"),
        query
    )
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await transactionQuery.modelQuery;
    const meta = await transactionQuery.getPaginationInfo();

    return { result, meta };
};

const getTransactionByReference = async (referenceId: string) => {
    const result = await WalletTransaction.findOne({ reference: referenceId })
        .populate("wallet", "balance")
        .populate("from", "fullName profilePicture email")
        .populate("to", "fullName profilePicture email");

    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
    }

    return result;
};

export const TransactionService = {
    getAllTransactionsFromDB,
    getMyTransactionsFromDB,
    getTransactionByReference
};
