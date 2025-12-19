import Stripe from 'stripe';
import stripe from '../../../config/stripe';
import config from '../../../config';
import { WalletService } from './wallet.service';
import ApiError from '../../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';

// Create Stripe Payment Intent for Wallet Top Up
const createTopUpPaymentIntent = async (
    userId: string,
    amount: number,
    userEmail: string
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    try {
        // Amount should be in cents (multiply by 100)
        const amountInCents = Math.round(amount * 100);

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd', // Change to your currency (bdt, usd, etc.)
            metadata: {
                userId,
                type: 'wallet_topup',
                amount: amount.toString(),
            },
            receipt_email: userEmail,
            description: `Wallet Top Up - ${amount}`,
        });

        return {
            clientSecret: paymentIntent.client_secret as string,
            paymentIntentId: paymentIntent.id,
        };
    } catch (error: any) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Stripe payment intent creation failed: ${error.message}`
        );
    }
};

// Handle successful payment (called from webhook)
const handleSuccessfulTopUpPayment = async (
    paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
    const { userId, amount } = paymentIntent.metadata;

    if (!userId || !amount) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Invalid payment metadata'
        );
    }

    // Add money to wallet
    await WalletService.topUp(userId, parseFloat(amount));
};

// Verify payment status
const verifyTopUpPayment = async (
    paymentIntentId: string
): Promise<{ status: string; amount: number }> => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        return {
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100, // Convert from cents
        };
    } catch (error: any) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to verify payment: ${error.message}`
        );
    }
};

export const StripeWalletService = {
    createTopUpPaymentIntent,
    handleSuccessfulTopUpPayment,
    verifyTopUpPayment,
};
