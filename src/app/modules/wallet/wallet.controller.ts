import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { WalletService } from "./wallet.service";
import { StripeWalletService } from "./wallet.stripe.service";
import { StatusCodes } from "http-status-codes";

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



// Create Stripe Payment Intent for Top Up
const createTopUpPaymentIntent = catchAsync(async (req, res) => {
  const { amount } = req.body;
  const result = await StripeWalletService.createTopUpPaymentIntent(
    req.user.id,
    amount,
    req.user.email
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payment intent created successfully",
    data: result,
  });
});

// Verify Stripe Payment
const verifyTopUpPayment = catchAsync(async (req, res) => {
  const { paymentIntentId } = req.body;
  const result = await StripeWalletService.verifyTopUpPayment(paymentIntentId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Payment verified successfully",
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
  createTopUpPaymentIntent,
  verifyTopUpPayment,
  sendMoney,
  withdraw,
  getmyWallet
};
