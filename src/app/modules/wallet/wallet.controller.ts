import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { WalletService } from "./wallet.service";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";

const topUp = catchAsync(async (req, res) => {
  const result = await WalletService.topUp(req.user.id, req.body.amount);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Top up successful",
    data: result,
  });
});

// Get my wallet
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
  const { receiverId, amount } = req.body;
  await WalletService.sendMoney(req.user.id, receiverId, amount);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Money sent successfully",
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
  topUp,
  sendMoney,
  withdraw,
  getmyWallet,
};
