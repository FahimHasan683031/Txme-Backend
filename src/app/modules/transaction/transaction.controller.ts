import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { TransactionService } from "./transaction.service";

const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
    const result = await TransactionService.getAllTransactionsFromDB(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "All transactions retrieved successfully",
        data: result,
    });
});

const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
    const result = await TransactionService.getMyTransactionsFromDB(req.user, req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "My transactions retrieved successfully",
        data: result,
    });
});

const getTransactionByReference = catchAsync(async (req: Request, res: Response) => {
    const { referenceId } = req.params;
    const result = await TransactionService.getTransactionByReference(referenceId);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Transaction retrieved successfully",
        data: result,
    });
});

export const TransactionController = {
    getAllTransactions,
    getMyTransactions,
    getTransactionByReference
};
