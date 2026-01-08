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

const createAccountLink = catchAsync(async (req, res) => {
    let { return_url, refresh_url } = req.body;

    if (!return_url || !refresh_url) {
        const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/stripe`;
        return_url = `${baseUrl}/return`;
        refresh_url = `${baseUrl}/refresh`;
    }

    const stripeAccountId = await StripeService.createExpressAccount(
        req.user.id,
        req.user.email
    );

    const url = await StripeService.createAccountLink(
        stripeAccountId,
        return_url,
        refresh_url
    );

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: "Account link created successfully",
        data: { url, stripeAccountId },
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

// Export moved to bottom


const handleConnectReturn = catchAsync(async (req, res) => {
    const successUrl = "txme://stripe/success";
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Stripe Connect Success</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
            window.location.href = "${successUrl}";
            setTimeout(function() {
                window.location.href = "${successUrl}";
            }, 1000);
        </script>
    </head>
    <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center; background-color: #f0f2f5;">
        <div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #28a745; margin-bottom: 10px;">Connection Successful!</h1>
            <p style="color: #666; margin-bottom: 20px;">Redirecting back to the app...</p>
            <a href="${successUrl}" style="padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Return to App</a>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

const handleConnectRefresh = catchAsync(async (req, res) => {
    const refreshUrl = "txme://stripe/refresh";
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Stripe Connect Refresh</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
            window.location.href = "${refreshUrl}";
            setTimeout(function() {
                window.location.href = "${refreshUrl}";
            }, 1000);
        </script>
    </head>
    <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; text-align: center; background-color: #f0f2f5;">
        <div style="padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #dc3545; margin-bottom: 10px;">Connection Incomplete</h1>
            <p style="color: #666; margin-bottom: 20px;">We need to restart the process. Redirecting...</p>
            <a href="${refreshUrl}" style="padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Try Again</a>
        </div>
    </body>
    </html>
    `;
    res.send(html);
});

export const StripeController = {
    createAccountLink,
    getAccountStatus,
    createTopUpPaymentIntent,
    verifyTopUpPayment,
    createAppointmentPaymentIntent,
    handleConnectReturn,
    handleConnectRefresh
};
