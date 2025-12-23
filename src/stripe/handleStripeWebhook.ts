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
    console.log("Stripe webhook received");

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
                console.log('Payment Intent Succeeded:', paymentIntent.id);
                console.log('Metadata:', JSON.stringify(paymentIntent.metadata, null, 2));

                // Check if this is a wallet top up payment
                if (paymentIntent.metadata.type === 'wallet_topup') {
                    console.log("Matched condition: wallet_topup");
                    try {
                        await StripeWalletService.handleSuccessfulTopUpPayment(paymentIntent);
                        logger.info(colors.bgGreen.bold(`Wallet top up payment succeeded: ${paymentIntent.id}`));
                    } catch (serviceError) {
                        console.error("Error in StripeWalletService:", serviceError);
                        logger.error(`Wallet top up service failed: ${serviceError}`);
                    }
                } else {
                    console.log("Condition NOT matched. Metadata type:", paymentIntent.metadata.type);
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