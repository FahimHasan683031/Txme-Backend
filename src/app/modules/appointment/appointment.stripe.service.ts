import Stripe from 'stripe';
import stripe from '../../../config/stripe';
import { Appointment } from './appointment.model';
import ApiError from '../../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from '../notification/notification.service';

// Create Stripe Payment Intent for Appointment
const createAppointmentPaymentIntent = async (
    appointmentId: string,
    userEmail: string
): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Appointment not found");
        }

        if (appointment.status !== 'awaiting_payment') {
            throw new ApiError(StatusCodes.BAD_REQUEST, `Payment not allowed for appointment in ${appointment.status} status`);
        }

        if (!appointment.totalCost || appointment.totalCost <= 0) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid appointment cost");
        }

        // Amount should be in cents (multiply by 100)
        const amountInCents = Math.round(appointment.totalCost * 100);

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            metadata: {
                appointmentId: appointmentId.toString(),
                type: 'appointment_payment',
                totalCost: appointment.totalCost.toString(),
            },
            receipt_email: userEmail,
            description: `Appointment Payment - ${appointmentId}`,
        });

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



// Handle successful payment (called from webhook)
const handleSuccessfulAppointmentPayment = async (
    paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
    const { appointmentId } = paymentIntent.metadata;

    if (!appointmentId) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Invalid payment metadata: appointmentId missing'
        );
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Appointment not found");
    }

    // Update appointment status to paid
    appointment.status = 'paid';
    await appointment.save();

    // Notify Provider
    await NotificationService.insertNotification({
        title: "Payment Received (Card)",
        message: `Payment received via Stripe for appointment ${appointmentId}. Amount: ${appointment.totalCost}`,
        receiver: appointment.provider,
        referenceId: appointment._id,
        screen: "WALLET",
        type: "USER"
    });
};

export const StripeAppointmentService = {
    createAppointmentPaymentIntent,
    handleSuccessfulAppointmentPayment,
};
