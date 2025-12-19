import { Request, Response } from 'express';
import Stripe from 'stripe';
import colors from 'colors';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../shared/logger';
import config from '../config';
import ApiError from '../errors/ApiErrors';
import stripe from '../config/stripe';
import { handleSubscriptionCreated } from './handleSubscriptionCreated';
import { StripeWalletService } from '../app/modules/wallet/wallet.stripe.service';

const handleStripeWebhook = async (req: Request, res: Response) => {

    // Extract Stripe signature and webhook secret
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = config.stripe.webhookSecret as string;

    let event: Stripe.Event | undefined;

    // Verify the event signature
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Webhook signature verification failed. ${error}`);
    }

    // Check if the event is valid
    if (!event) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid event received!');
    }

    // Extract event data and type
    const eventType = event.type;

    // Handle the event based on its type
    try {
        switch (eventType) {
            case 'customer.subscription.created':
                const subscription = event.data.object as Stripe.Subscription;
                await handleSubscriptionCreated(subscription);
                break;

            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                // Check if this is a wallet top up payment
                if (paymentIntent.metadata.type === 'wallet_topup') {
                    await StripeWalletService.handleSuccessfulTopUpPayment(paymentIntent);
                    logger.info(colors.bgGreen.bold(`Wallet top up payment succeeded: ${paymentIntent.id}`));
                }
                break;

            default:
                logger.warn(colors.bgGreen.bold(`Unhandled event type: ${eventType}`));
        }
    } catch (error) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Error handling event: ${error}`,);
    }

    res.sendStatus(200);
};

export default handleStripeWebhook;