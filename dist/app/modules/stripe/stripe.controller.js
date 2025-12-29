"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeController = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const stripe_service_1 = require("./stripe.service");
const http_status_codes_1 = require("http-status-codes");
const createTopUpPaymentIntent = (0, catchAsync_1.default)(async (req, res) => {
    const { amount } = req.body;
    const result = await stripe_service_1.StripeService.createTopUpPaymentIntent(req.user.id, amount, req.user.email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Payment intent created successfully",
        data: result,
    });
});
const verifyTopUpPayment = (0, catchAsync_1.default)(async (req, res) => {
    const { paymentIntentId } = req.body;
    const result = await stripe_service_1.StripeService.verifyTopUpPayment(paymentIntentId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Payment verified successfully",
        data: result,
    });
});
const createAppointmentPaymentIntent = (0, catchAsync_1.default)(async (req, res) => {
    const { appointmentId } = req.params;
    const result = await stripe_service_1.StripeService.createAppointmentPaymentIntent(appointmentId, req.user.email);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Appointment payment intent created successfully",
        data: result,
    });
});
const createAccountSession = (0, catchAsync_1.default)(async (req, res) => {
    const stripeAccountId = await stripe_service_1.StripeService.createExpressAccount(req.user.id, req.user.email);
    const clientSecret = await stripe_service_1.StripeService.createAccountSession(stripeAccountId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Account session created successfully",
        data: { clientSecret, stripeAccountId },
    });
});
const getAccountStatus = (0, catchAsync_1.default)(async (req, res) => {
    const result = await stripe_service_1.StripeService.getAccountStatus(req.user.id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: "Account status retrieved successfully",
        data: result,
    });
});
exports.StripeController = {
    createAccountSession,
    getAccountStatus,
    createTopUpPaymentIntent,
    verifyTopUpPayment,
    createAppointmentPaymentIntent
};
