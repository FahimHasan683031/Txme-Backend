import { Response } from 'express';
import { WalletTransaction } from '../transaction/transaction.model';
import { Appointment } from '../appointment/appointment.model';
import ApiError from '../../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { buildProfessionalInvoicePDF, IInvoicePDFPayload } from '../../../helpers/pdfInvoiceGenerator';

const generateInvoicePDF = async (data: IInvoicePDFPayload, res: Response) => {
    await buildProfessionalInvoicePDF(data, res);
};

const getInvoiceForTransaction = async (transactionId: string, userId: string): Promise<IInvoicePDFPayload> => {
    const transaction = await WalletTransaction.findById(transactionId)
        .populate('from', 'fullName email phone role')
        .populate('to', 'fullName email phone role') as any;

    if (!transaction) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found');
    }

    // Authorization check (Sender or Receiver)
    const isAuthorized =
        transaction.from?._id?.toString() === userId ||
        transaction.to?._id?.toString() === userId ||
        transaction.wallet?.toString() === userId;

    if (!isAuthorized) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to download this invoice');
    }

    const details: Record<string, any> = {
        'Transaction ID': transaction._id.toString(),
        'Transaction Type': transaction.type.toUpperCase(),
        'Payment Platform': transaction.platform || 'System Wallet',
    };

    if (transaction.reference) {
        details['Reference / TxID'] = transaction.reference;
    }

    return {
        invoiceNumber: transaction._id.toString(),
        date: transaction.createdAt,
        amount: transaction.amount,
        status: transaction.status,
        paymentMethod: transaction.platform || 'Wallet',
        billedFrom: {
            name: transaction.from?.fullName || 'Txme Platform System',
            email: transaction.from?.email || 'system@txme.app',
            role: transaction.from?.role || 'SYSTEM'
        },
        billedTo: {
            name: transaction.to?.fullName || 'Valued User',
            email: transaction.to?.email || 'N/A',
            phone: transaction.to?.phone || 'N/A'
        },
        details
    };
};

const getInvoiceForAppointment = async (appointmentId: string, userId: string): Promise<IInvoicePDFPayload> => {
    const appointment = await Appointment.findById(appointmentId)
        .populate('customer', 'fullName email phone residentialAddress')
        .populate('provider', 'fullName email phone residentialAddress providerProfile') as any;

    if (!appointment) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
    }

    const isAuthorized =
        appointment.customer._id.toString() === userId ||
        appointment.provider._id.toString() === userId;

    if (!isAuthorized) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to download this invoice');
    }

    const customerAddress = appointment.customer?.residentialAddress?.address ||
        `${appointment.customer?.residentialAddress?.city || ''} ${appointment.customer?.residentialAddress?.postCode || ''}`.trim() ||
        'Provided in App';

    const details: Record<string, any> = {
        'Booked Service': appointment.service,
        'Service Provider': appointment.provider?.fullName || 'Txme Provider',
        'Customer Name': appointment.customer?.fullName || 'Txme Customer',
        'Payment Method': appointment.paymentMethod?.toUpperCase() || 'N/A',
        'Service Duration': appointment.totalWorkedTime ? `${appointment.totalWorkedTime} Hours` : 'Fixed Service',
        'Hourly Rate': appointment.provider?.providerProfile?.hourlyRate ? `€${appointment.provider.providerProfile.hourlyRate}/hr` : 'Standard'
    };

    return {
        invoiceNumber: appointment._id.toString(),
        date: appointment.updatedAt || appointment.createdAt,
        amount: appointment.totalCost || appointment.price || 0,
        status: appointment.status,
        paymentMethod: appointment.paymentMethod,
        billedFrom: {
            name: appointment.provider?.fullName || 'Txme Provider Service',
            email: appointment.provider?.email || 'provider@txme.app',
            role: 'Verified Service Provider'
        },
        billedTo: {
            name: appointment.customer?.fullName || 'Txme Customer',
            email: appointment.customer?.email || 'N/A',
            phone: appointment.customer?.phone || 'N/A',
            address: customerAddress
        },
        details
    };
};

export const InvoiceService = {
    generateInvoicePDF,
    getInvoiceForTransaction,
    getInvoiceForAppointment
};
