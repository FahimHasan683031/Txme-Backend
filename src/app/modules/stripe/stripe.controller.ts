import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { StripeService } from "./stripe.service";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";

const createStripeConnectAccount = catchAsync(async (req, res) => {
    const stripeAccountId = await StripeService.createExpressAccount(req.user.id, req.user.email);
    const onboardingUrl = await StripeService.createOnboardingLink(
        stripeAccountId,
        `${config.stripe.paymentSuccess}/stripe-connect/success`,
        `${config.stripe.paymentSuccess}/stripe-connect/refresh`
    );

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Onboarding link created",
        data: { onboardingUrl },
    });
});

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

export const StripeController = {
    createStripeConnectAccount,
    createTopUpPaymentIntent,
    verifyTopUpPayment,
    createAppointmentPaymentIntent
};
