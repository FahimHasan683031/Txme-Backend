import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StripeService } from "./stripe.service";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";

const createTopUpPaymentIntent = catchAsync(async (req, res) => {
    const { amount } = req.body;
    const result = await StripeService.createTopUpPaymentIntent(
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

const verifyTopUpPayment = catchAsync(async (req, res) => {
    const { paymentIntentId } = req.body;
    const result = await StripeService.verifyTopUpPayment(paymentIntentId);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Payment verified successfully",
        data: result,
    });
});

const createAppointmentPaymentIntent = catchAsync(async (req, res) => {
    const { appointmentId } = req.params;
    const result = await StripeService.createAppointmentPaymentIntent(
        appointmentId,
        req.user.email
    );
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Appointment payment intent created successfully",
        data: result,
    });
});

const createAccountSession = catchAsync(async (req, res) => {
    const stripeAccountId = await StripeService.createExpressAccount(req.user.id, req.user.email);
    const clientSecret = await StripeService.createAccountSession(stripeAccountId);

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Account session created successfully",
        data: { clientSecret, stripeAccountId },
    });
});

const getAccountStatus = catchAsync(async (req, res) => {
    const result = await StripeService.getAccountStatus(req.user.id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Account status retrieved successfully",
        data: result,
    });
});

export const StripeController = {
    createAccountSession,
    getAccountStatus,
    createTopUpPaymentIntent,
    verifyTopUpPayment,
    createAppointmentPaymentIntent
};
