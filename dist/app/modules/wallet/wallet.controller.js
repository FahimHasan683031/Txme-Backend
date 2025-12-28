"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const wallet_service_1 = require("./wallet.service");
const http_status_codes_1 = require("http-status-codes");
const topUp = (0, catchAsync_1.default)(async (req, res) => {
    const result = await wallet_service_1.WalletService.topUp(req.user.id, req.body.amount);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Top up successful",
        data: result,
    });
});
// Get my wallet
const getmyWallet = (0, catchAsync_1.default)(async (req, res) => {
    const result = await wallet_service_1.WalletService.getmyWallet(req.user.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Wallet retrieved successfully",
        data: result,
    });
});
const sendMoney = (0, catchAsync_1.default)(async (req, res) => {
    const { receiverId: receiverIdentifier, amount } = req.body;
    await wallet_service_1.WalletService.sendMoney(req.user.id, receiverIdentifier, amount);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Money sent successfully",
    });
});
const withdraw = (0, catchAsync_1.default)(async (req, res) => {
    const result = await wallet_service_1.WalletService.withdraw(req.user.id, req.body.amount);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Withdraw request submitted",
        data: result,
    });
});
exports.WalletController = {
    topUp,
    sendMoney,
    withdraw,
    getmyWallet,
};
