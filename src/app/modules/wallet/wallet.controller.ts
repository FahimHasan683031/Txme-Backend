import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { WalletService } from "./wallet.service";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";

const getmyWallet = catchAsync(async (req, res) => {
  const result = await WalletService.getmyWallet(req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Wallet retrieved successfully",
    data: result,
  });
});



const sendMoney = catchAsync(async (req, res) => {
  const { receiverIdOrEmail: receiverIdentifier, amount } = req.body;
  const result = await WalletService.sendMoney(req.user.id, receiverIdentifier, amount);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Money sent successfully",
    data: result,
  });
});

const withdraw = catchAsync(async (req, res) => {
  const result = await WalletService.withdraw(req.user.id, req.body.amount);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Withdraw request submitted",
    data: result,
  });
});

export const WalletController = {
  getmyWallet,
  sendMoney,
  withdraw,
};
