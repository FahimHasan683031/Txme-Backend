"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = __importDefault(require("colors"));
const http_status_codes_1 = require("http-status-codes");
const logger_1 = require("../shared/logger");
const config_1 = __importDefault(require("../config"));
const ApiErrors_1 = __importDefault(require("../errors/ApiErrors"));
const stripe_1 = __importDefault(require("../config/stripe"));
const stripe_service_1 = require("../app/modules/stripe/stripe.service");
const catchAsync_1 = __importDefault(require("../shared/catchAsync"));
const notification_service_1 = require("../app/modules/notification/notification.service");
const appointment_model_1 = require("../app/modules/appointment/appointment.model");
const handleStripeWebhook = (0, catchAsync_1.default)(async (req, res) => {
    console.log("Stripe webhook received");
    const signature = req.headers['stripe-signature'];
    const webhookSecret = config_1.default.stripe.webhookSecret;
    if (!signature || !webhookSecret) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Stripe signature or webhook secret is missing");
    }
    let event;
    try {
        event = stripe_1.default.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Webhook signature verification failed: ${error.message}`);
    }
    const eventType = event.type;
    try {
        switch (eventType) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log('Checkout Session Completed:', session.id);
                const sessionMetadata = session.metadata || {};
                if (sessionMetadata.type === 'appointment_payment') {
                    // Extract appointmentId from metadata
                    const appointmentId = sessionMetadata.appointmentId;
                    if (appointmentId) {
                        // We can manually call a slim version of handleSuccessfulAppointmentPayment
                        // Or fetch the payment intent. For simplicity, let's adapt a bit.
                        const appointment = await appointment_model_1.Appointment.findById(appointmentId);
                        if (appointment) {
                            appointment.status = 'review_pending';
                            await appointment.save();
                            // Notify Provider
                            await notification_service_1.NotificationService.insertNotification({
                                title: "Payment Received (Checkout)",
                                message: `Payment received for appointment ${appointmentId}. Amount: ${appointment.totalCost}`,
                                receiver: appointment.provider,
                                referenceId: appointment._id,
                                screen: "APPOINTMENT",
                                type: "USER"
                            });
                            // Notify Customer
                            await notification_service_1.NotificationService.insertNotification({
                                title: "Payment Successful",
                                message: `Your checkout payment of ${appointment.totalCost} for appointment ${appointmentId} was successful.`,
                                receiver: appointment.customer,
                                referenceId: appointment._id,
                                screen: "APPOINTMENT",
                                type: "USER"
                            });
                            logger_1.logger.info(colors_1.default.bgGreen.bold(`Appointment payment via Checkout succeeded: ${session.id}`));
                        }
                    }
                }
                break;
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('Payment Intent Succeeded:', paymentIntent.id);
                const metadata = paymentIntent.metadata || {};
                if (metadata.type === 'wallet_topup') {
                    await stripe_service_1.StripeService.handleSuccessfulTopUpPayment(paymentIntent);
                    logger_1.logger.info(colors_1.default.bgGreen.bold(`Wallet top up payment succeeded: ${paymentIntent.id}`));
                }
                else if (metadata.type === 'appointment_payment') {
                    await stripe_service_1.StripeService.handleSuccessfulAppointmentPayment(paymentIntent);
                    logger_1.logger.info(colors_1.default.bgGreen.bold(`Appointment payment succeeded: ${paymentIntent.id}`));
                }
                else {
                    console.log("No specific handler for this payment intent type:", metadata.type);
                }
                break;
            case 'account.updated':
                const account = event.data.object;
                await stripe_service_1.StripeService.handleAccountUpdate(account);
                logger_1.logger.info(colors_1.default.bgGreen.bold(`Stripe account updated: ${account.id}`));
                break;
            default:
                logger_1.logger.warn(colors_1.default.bgYellow.bold(`Unhandled event type: ${eventType}`));
        }
    }
    catch (error) {
        logger_1.logger.error(`Error processing Stripe event ${eventType}: ${error.message}`);
        // We still return 200 to Stripe to avoid retries if the error is handled/logged
        // but since we use catchAsync, this will trigger the global error handler
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error handling event: ${error.message}`);
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({ received: true });
});
exports.default = handleStripeWebhook;
