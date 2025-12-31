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

const downloadInvoice = catchAsync(async (req: Request, res: Response) => {
    const { transactionId } = req.params;
    const doc = await TransactionService.generateInvoicePDF(transactionId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${transactionId}.pdf`);

    doc.pipe(res);
});

export const TransactionController = {
    getAllTransactions,
    getMyTransactions,
    getTransactionByReference,
    downloadInvoice
};
