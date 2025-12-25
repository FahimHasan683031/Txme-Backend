import stripe from '../../../config/stripe';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import { WalletService } from '../wallet/wallet.service';
import { Appointment } from '../appointment/appointment.model';
import { NotificationService } from '../notification/notification.service';

// --- Wallet Management (formerly wallet.stripe.service.ts) ---

const createTopUpPaymentIntent = async (
    userId: string,
    amount: number,
    userEmail: string
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    try {
        const amountInCents = Math.round(amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
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

const handleSuccessfulTopUpPayment = async (
    paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
    const { userId, amount } = paymentIntent.metadata;

    if (!userId || !amount) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid payment metadata');
    }

    await WalletService.topUp(userId, parseFloat(amount));
};

const verifyTopUpPayment = async (
    paymentIntentId: string
): Promise<{ status: string; amount: number }> => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        return {
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
        };
    } catch (error: any) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to verify payment: ${error.message}`
        );
    }
};

// --- Connect Account Management (formerly stripe.connect.service.ts) ---

const createExpressAccount = async (userId: string, email: string) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    if (user.stripeAccountId) {
        return user.stripeAccountId;
    }

    const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
    });

    user.stripeAccountId = account.id;
    await user.save();

    return account.id;
};

const createOnboardingLink = async (stripeAccountId: string, returnUrl: string, refreshUrl: string) => {
    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
    });

    return accountLink.url;
};

const getAccount = async (stripeAccountId: string) => {
    return await stripe.accounts.retrieve(stripeAccountId);
};

const handleAccountUpdate = async (account: Stripe.Account) => {
    if (account.details_submitted) {
        const user = await User.findOne({ stripeAccountId: account.id });
        if (user) {
            user.isStripeConnected = true;
            await user.save();
        }
    }
};

const createTransfer = async (amount: number, destinationAccountId: string, metadata: any) => {
    return await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: destinationAccountId,
        metadata
    });
};

const createPayout = async (amount: number, stripeAccountId: string) => {
    return await stripe.payouts.create(
        {
            amount: Math.round(amount * 100),
            currency: 'usd',
        },
        {
            stripeAccount: stripeAccountId,
        }
    );
};

// --- Appointment Management (formerly appointment.stripe.service.ts) ---

const createAppointmentPaymentIntent = async (
    appointmentId: string,
    userEmail: string
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    try {
        const appointment = await Appointment.findById(appointmentId).populate('provider');
        if (!appointment) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Appointment not found");
        }

        const provider = await User.findById(appointment.provider);
        if (!provider) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found");
        }

        if (appointment.status !== 'awaiting_payment') {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Payment not allowed for appointment in ${appointment.status} status`);
        }

        if (!appointment.totalCost || appointment.totalCost <= 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid appointment cost");
        }

        const amountInCents = Math.round(appointment.totalCost * 100);

        let paymentIntentParams: Stripe.PaymentIntentCreateParams = {
            amount: amountInCents,
            currency: 'usd',
            metadata: {
                appointmentId: appointmentId.toString(),
                type: 'appointment_payment',
                totalCost: appointment.totalCost.toString(),
            },
            receipt_email: userEmail,
            description: `Appointment Payment - ${appointmentId}`,
        };

        if (provider.isStripeConnected && provider.stripeAccountId) {
            const providerShare = amountInCents;
            paymentIntentParams.transfer_data = {
                destination: provider.stripeAccountId,
                amount: providerShare
            };
        }

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

        return {
            clientSecret: paymentIntent.client_secret as string,
            paymentIntentId: paymentIntent.id,
        };
    } catch (error: any) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Stripe payment intent creation failed: ${error.message}`
        );
    }
};

const handleSuccessfulAppointmentPayment = async (
    paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
    const { appointmentId } = paymentIntent.metadata;

    if (!appointmentId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid payment metadata: appointmentId missing');
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Appointment not found");
    }

    appointment.status = 'paid';
    await appointment.save();

    await NotificationService.insertNotification({
        title: "Payment Received (Card)",
        message: `Payment received via Stripe for appointment ${appointmentId}. Amount: ${appointment.totalCost}`,
        receiver: appointment.provider,
        referenceId: appointment._id,
        screen: "WALLET",
        type: "USER"
    });
};

export const StripeService = {
    // Wallet topup
    createTopUpPaymentIntent,
    handleSuccessfulTopUpPayment,
    verifyTopUpPayment,
    // Connect
    createExpressAccount,
    createOnboardingLink,
    getAccount,
    handleAccountUpdate,
    createTransfer,
    createPayout,
    // Appointment
    createAppointmentPaymentIntent,
    handleSuccessfulAppointmentPayment
};
