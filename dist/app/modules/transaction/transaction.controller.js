"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const transaction_service_1 = require("./transaction.service");
const getAllTransactions = (0, catchAsync_1.default)(async (req, res) => {
    const result = await transaction_service_1.TransactionService.getAllTransactionsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "All transactions retrieved successfully",
        data: result,
    });
});
const getMyTransactions = (0, catchAsync_1.default)(async (req, res) => {
    const result = await transaction_service_1.TransactionService.getMyTransactionsFromDB(req.user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "My transactions retrieved successfully",
        data: result,
    });
});
exports.TransactionController = {
    getAllTransactions,
    getMyTransactions,
};
