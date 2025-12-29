import stripe from '../../../config/stripe';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import Stripe from 'stripe';
import { WalletService } from '../wallet/wallet.service';
import { Appointment } from '../appointment/appointment.model';
import { NotificationService } from '../notification/notification.service';
import config from '../../../config';
import { emitAppointmentUpdate } from '../../../util/appointment.util';
import { checkCardPaymentSetting, checkWalletSetting } from '../../../helpers/checkSetting';

// --- Wallet Management (formerly wallet.stripe.service.ts) ---

const createTopUpPaymentIntent = async (
    userId: string,
    amount: number,
    userEmail: string
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    await checkWalletSetting('topUp');
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

    // Prepare pre-filled data for Stripe
    const individual: Stripe.AccountCreateParams.Individual = {};

    if (user.email) individual.email = user.email;
    if (user.phone) {
        // Stripe expects E.164 format, which our phone field should already be in (+...)
        individual.phone = user.phone.startsWith('+') ? user.phone : `+${user.phone}`;
    }

    if (user.fullName) {
        const nameParts = user.fullName.trim().split(/\s+/);
        if (nameParts.length > 0) {
            individual.first_name = nameParts[0];
            if (nameParts.length > 1) {
                individual.last_name = nameParts.slice(1).join(' ');
            }
        }
    }

    if (user.dateOfBirth) {
        const dob = new Date(user.dateOfBirth);
        individual.dob = {
            day: dob.getUTCDate(),
            month: dob.getUTCMonth() + 1,
            year: dob.getUTCFullYear(),
        };
    }

    if (user.gender) {
        const gender = user.gender.toLowerCase();
        if (gender === 'male' || gender === 'female') {
            individual.gender = gender;
        }
    }

    if (user.residentialAddress?.address) {
        individual.address = {
            line1: user.residentialAddress.address,
            // You can add city, state, postal_code here if you have separate fields for them
        };
    }

    const account = await stripe.accounts.create({
        type: 'express',
        email: email,
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
        individual: Object.keys(individual).length > 0 ? individual : undefined,
        business_type: 'individual',
    });

    user.stripeAccountId = account.id;
    await user.save();

    return account.id;
};

// function removed

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
    await checkCardPaymentSetting();
    try {
        const appointment = await Appointment.findById(appointmentId).populate('provider');
        if (!appointment) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Appointment not found");
        }

        const provider = await User.findById(appointment.provider);
        if (!provider) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found");
        }

        if (!provider.isStripeConnected || !provider.stripeAccountId) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Provider has not connected their Stripe account yet. Payment cannot be processed.");
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

    appointment.status = 'review_pending';
    await appointment.save();

    // Notify Provider
    await NotificationService.insertNotification({
        title: "Payment Received (Card)",
        message: `Payment received for appointment ${appointmentId}. Amount: ${appointment.totalCost}`,
        receiver: appointment.provider,
        referenceId: appointment._id,
        screen: "APPOINTMENT",
        type: "USER"
    });

    // Notify Customer
    await NotificationService.insertNotification({
        title: "Payment Successful",
        message: `Your payment of ${appointment.totalCost} for appointment ${appointmentId} was successful.`,
        receiver: appointment.customer,
        referenceId: appointment._id,
        screen: "APPOINTMENT",
        type: "USER"
    });
};

const createAccountLink = async (
    stripeAccountId: string,
    returnUrl: string,
    refreshUrl: string
) => {
    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
    });

    return accountLink.url;
};

const getAccountStatus = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

    if (!user.stripeAccountId) {
        return {
            isConnected: false,
            detailsSubmitted: false,
            requirements: [],
            stripeAccountId: null
        };
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    // Sync local status with Stripe status
    if (account.details_submitted && !user.isStripeConnected) {
        user.isStripeConnected = true;
        await user.save();
    }

    return {
        isConnected: user.isStripeConnected,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements?.currently_due || [],
        stripeAccountId: user.stripeAccountId,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled
    };
};

export const StripeService = {
    // Wallet topup
    createTopUpPaymentIntent,
    handleSuccessfulTopUpPayment,
    verifyTopUpPayment,
    // Connect
    createExpressAccount,
    createAccountLink,
    getAccountStatus,
    getAccount,
    handleAccountUpdate,
    createTransfer,
    createPayout,
    // Appointment
    createAppointmentPaymentIntent,
    handleSuccessfulAppointmentPayment
};
