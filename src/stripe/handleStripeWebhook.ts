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
import { NotificationService } from '../app/modules/notification/notification.service';
import { WalletService } from '../app/modules/wallet/wallet.service';
import { Appointment } from '../app/modules/appointment/appointment.model';

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    console.log("Stripe webhook received");

    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = config.stripe.webhookSecret as string;

    if (!signature || !webhookSecret) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Stripe signature or webhook secret is missing");
    }

    let event: Stripe.Event;
    const payload = (req as any).rawBody || req.body;

    try {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error: any) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Webhook signature verification failed: ${error.message}`);
    }

    const eventType = event.type;

    try {
        switch (eventType) {
            case 'checkout.session.completed':
                const session = event.data.object as Stripe.Checkout.Session;
                console.log('Checkout Session Completed:', session.id);

                const sessionMetadata = session.metadata || {};

                if (sessionMetadata.type === 'wallet_topup') {
                    const paymentIntentId = typeof session.payment_intent === 'string'
                        ? session.payment_intent
                        : session.payment_intent?.id;

                    if (paymentIntentId) {
                        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                        await StripeService.handleSuccessfulTopUpPayment(paymentIntent);
                        logger.info(colors.bgGreen.bold(`Wallet top up via Checkout succeeded: ${session.id}`));
                    } else {
                        const userId = sessionMetadata.userId;
                        const amount = sessionMetadata.amount;
                        if (userId && amount) {
                            await WalletService.topUp(userId, parseFloat(amount), session.id);
                            logger.info(colors.bgGreen.bold(`Wallet top up via Checkout succeeded: ${session.id}`));
                        }
                    }
                } else if (sessionMetadata.type === 'appointment_payment') {
                    const appointmentId = sessionMetadata.appointmentId;
                    if (appointmentId) {
                        await StripeService.handleSuccessfulAppointmentPayment({
                            metadata: { appointmentId }
                        } as any);
                        logger.info(colors.bgGreen.bold(`Appointment payment via Checkout succeeded: ${session.id}`));
                    }
                }
                break;

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

            case 'payment_intent.payment_failed':
                const failedIntent = event.data.object as Stripe.PaymentIntent;
                const failedMetadata = failedIntent.metadata || {};
                logger.error(colors.bgRed.bold(`Payment Intent failed: ${failedIntent.id}, reason: ${failedIntent.last_payment_error?.message || 'Unknown'}`));
                if (failedMetadata.appointmentId) {
                    try {
                        await Appointment.findByIdAndUpdate(failedMetadata.appointmentId, {
                            status: 'awaiting_payment'
                        });
                    } catch (e: any) {
                        logger.error(`Failed to update appointment status on payment failure: ${e.message}`);
                    }
                }
                break;

            case 'charge.refunded':
                const charge = event.data.object as Stripe.Charge;
                logger.warn(colors.bgYellow.bold(`Charge refunded: ${charge.id}, amount: ${charge.amount_refunded / 100}`));
                break;

            case 'transfer.reversed':
                const transfer = event.data.object as Stripe.Transfer;
                logger.warn(colors.bgYellow.bold(`Transfer reversed: ${transfer.id}, amount: ${transfer.amount_reversed / 100}`));
                break;

            default:
                logger.warn(colors.bgYellow.bold(`Unhandled event type: ${eventType}`));
        }
    } catch (error: any) {
        logger.error(`Error processing Stripe event ${eventType}: ${error.message}`);
        // Log internal error and return 200 OK so Stripe does not disable the webhook endpoint due to retries
        res.status(StatusCodes.OK).json({ received: true, error: error.message });
        return;
    }

    res.status(StatusCodes.OK).json({ received: true });
});

export default handleStripeWebhook;
