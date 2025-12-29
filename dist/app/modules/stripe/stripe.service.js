"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("../../../config/stripe"));
const user_model_1 = require("../user/user.model");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const wallet_service_1 = require("../wallet/wallet.service");
const appointment_model_1 = require("../appointment/appointment.model");
const notification_service_1 = require("../notification/notification.service");
const checkSetting_1 = require("../../../helpers/checkSetting");
// --- Wallet Management (formerly wallet.stripe.service.ts) ---
const createTopUpPaymentIntent = async (userId, amount, userEmail) => {
    await (0, checkSetting_1.checkWalletSetting)('topUp');
    try {
        const amountInCents = Math.round(amount * 100);
        const paymentIntent = await stripe_1.default.paymentIntents.create({
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
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    }
    catch (error) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Stripe payment intent creation failed: ${error.message}`);
    }
};
const handleSuccessfulTopUpPayment = async (paymentIntent) => {
    const { userId, amount } = paymentIntent.metadata;
    if (!userId || !amount) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid payment metadata');
    }
    await wallet_service_1.WalletService.topUp(userId, parseFloat(amount));
};
const verifyTopUpPayment = async (paymentIntentId) => {
    try {
        const paymentIntent = await stripe_1.default.paymentIntents.retrieve(paymentIntentId);
        return {
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
        };
    }
    catch (error) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Failed to verify payment: ${error.message}`);
    }
};
// --- Connect Account Management (formerly stripe.connect.service.ts) ---
const createExpressAccount = async (userId, email) => {
    var _a;
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    if (user.stripeAccountId) {
        return user.stripeAccountId;
    }
    // Prepare pre-filled data for Stripe
    const individual = {};
    if (user.email)
        individual.email = user.email;
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
    if ((_a = user.residentialAddress) === null || _a === void 0 ? void 0 : _a.address) {
        individual.address = {
            line1: user.residentialAddress.address,
            // You can add city, state, postal_code here if you have separate fields for them
        };
    }
    const account = await stripe_1.default.accounts.create({
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
const getAccount = async (stripeAccountId) => {
    return await stripe_1.default.accounts.retrieve(stripeAccountId);
};
const handleAccountUpdate = async (account) => {
    if (account.details_submitted) {
        const user = await user_model_1.User.findOne({ stripeAccountId: account.id });
        if (user) {
            user.isStripeConnected = true;
            await user.save();
        }
    }
};
const createTransfer = async (amount, destinationAccountId, metadata) => {
    return await stripe_1.default.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: destinationAccountId,
        metadata
    });
};
const createPayout = async (amount, stripeAccountId) => {
    return await stripe_1.default.payouts.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
    }, {
        stripeAccount: stripeAccountId,
    });
};
// --- Appointment Management (formerly appointment.stripe.service.ts) ---
const createAppointmentPaymentIntent = async (appointmentId, userEmail) => {
    await (0, checkSetting_1.checkCardPaymentSetting)();
    try {
        const appointment = await appointment_model_1.Appointment.findById(appointmentId).populate('provider');
        if (!appointment) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
        }
        const provider = await user_model_1.User.findById(appointment.provider);
        if (!provider) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Provider not found");
        }
        if (!provider.isStripeConnected || !provider.stripeAccountId) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Provider has not connected their Stripe account yet. Payment cannot be processed.");
        }
        if (appointment.status !== 'awaiting_payment') {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, `Payment not allowed for appointment in ${appointment.status} status`);
        }
        if (!appointment.totalCost || appointment.totalCost <= 0) {
            throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid appointment cost");
        }
        const amountInCents = Math.round(appointment.totalCost * 100);
        let paymentIntentParams = {
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
        const paymentIntent = await stripe_1.default.paymentIntents.create(paymentIntentParams);
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    }
    catch (error) {
        if (error instanceof ApiErrors_1.default)
            throw error;
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Stripe payment intent creation failed: ${error.message}`);
    }
};
const handleSuccessfulAppointmentPayment = async (paymentIntent) => {
    const { appointmentId } = paymentIntent.metadata;
    if (!appointmentId) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid payment metadata: appointmentId missing');
    }
    const appointment = await appointment_model_1.Appointment.findById(appointmentId);
    if (!appointment) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Appointment not found");
    }
    appointment.status = 'review_pending';
    await appointment.save();
    // Notify Provider
    await notification_service_1.NotificationService.insertNotification({
        title: "Payment Received (Card)",
        message: `Payment received for appointment ${appointmentId}. Amount: ${appointment.totalCost}`,
        receiver: appointment.provider,
        referenceId: appointment._id,
        screen: "APPOINTMENT",
        type: "USER"
    });
    // Notify Customer
    await notification_service_1.NotificationService.insertNotification({
        title: "Payment Successful",
        message: `Your payment of ${appointment.totalCost} for appointment ${appointmentId} was successful.`,
        receiver: appointment.customer,
        referenceId: appointment._id,
        screen: "APPOINTMENT",
        type: "USER"
    });
};
const createAccountSession = async (stripeAccountId) => {
    const accountSession = await stripe_1.default.accountSessions.create({
        account: stripeAccountId,
        components: {
            account_onboarding: { enabled: true },
        },
    });
    return accountSession.client_secret;
};
const getAccountStatus = async (userId) => {
    var _a;
    const user = await user_model_1.User.findById(userId);
    if (!user)
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    if (!user.stripeAccountId) {
        return {
            isConnected: false,
            detailsSubmitted: false,
            requirements: [],
            stripeAccountId: null
        };
    }
    const account = await stripe_1.default.accounts.retrieve(user.stripeAccountId);
    // Sync local status with Stripe status
    if (account.details_submitted && !user.isStripeConnected) {
        user.isStripeConnected = true;
        await user.save();
    }
    return {
        isConnected: user.isStripeConnected,
        detailsSubmitted: account.details_submitted,
        requirements: ((_a = account.requirements) === null || _a === void 0 ? void 0 : _a.currently_due) || [],
        stripeAccountId: user.stripeAccountId,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled
    };
};
exports.StripeService = {
    // Wallet topup
    createTopUpPaymentIntent,
    handleSuccessfulTopUpPayment,
    verifyTopUpPayment,
    // Connect
    createExpressAccount,
    createAccountSession,
    getAccountStatus,
    getAccount,
    handleAccountUpdate,
    createTransfer,
    createPayout,
    // Appointment
    createAppointmentPaymentIntent,
    handleSuccessfulAppointmentPayment
};
