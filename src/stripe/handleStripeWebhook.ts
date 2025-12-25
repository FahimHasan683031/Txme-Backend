import { Request, Response } from 'express';
import Stripe from 'stripe';
import colors from 'colors';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../shared/logger';
import config from '../config';
import ApiError from '../errors/ApiErrors';
import stripe from '../config/stripe';
import { StripeService } from '../app/modules/stripe/stripe.service';
import catchAsync from '../shared/catchAsync';

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    console.log("Stripe webhook received");

    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = config.stripe.webhookSecret as string;

    if (!signature || !webhookSecret) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Stripe signature or webhook secret is missing");
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error: any) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Webhook signature verification failed: ${error.message}`);
    }

    const eventType = event.type;

    try {
        switch (eventType) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('Payment Intent Succeeded:', paymentIntent.id);

                const metadata = paymentIntent.metadata || {};

                if (metadata.type === 'wallet_topup') {
                    await StripeService.handleSuccessfulTopUpPayment(paymentIntent);
                    logger.info(colors.bgGreen.bold(`Wallet top up payment succeeded: ${paymentIntent.id}`));
                } else if (metadata.type === 'appointment_payment') {
                    await StripeService.handleSuccessfulAppointmentPayment(paymentIntent);
                    logger.info(colors.bgGreen.bold(`Appointment payment succeeded: ${paymentIntent.id}`));
                } else {
                    console.log("No specific handler for this payment intent type:", metadata.type);
                }
                break;

            case 'account.updated':
                const account = event.data.object as Stripe.Account;
                await StripeService.handleAccountUpdate(account);
                logger.info(colors.bgGreen.bold(`Stripe account updated: ${account.id}`));
                break;

            default:
                logger.warn(colors.bgYellow.bold(`Unhandled event type: ${eventType}`));
        }
    } catch (error: any) {
        logger.error(`Error processing Stripe event ${eventType}: ${error.message}`);
        // We still return 200 to Stripe to avoid retries if the error is handled/logged
        // but since we use catchAsync, this will trigger the global error handler
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Error handling event: ${error.message}`);
    }

    res.status(StatusCodes.OK).json({ received: true });
});

export default handleStripeWebhook;
