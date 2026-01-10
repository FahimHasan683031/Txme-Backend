import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { WalletTransaction } from '../transaction/transaction.model';
import { Appointment } from '../appointment/appointment.model';
import ApiError from '../../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';
import { User } from '../user/user.model';

const generateInvoicePDF = (data: any, res: Response) => {
    const doc = new PDFDocument({ margin: 50 });

    const filename = `invoice-${data.invoiceNumber}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Header
    doc
        .fontSize(20)
        .text('Txme Invoice', { align: 'center' })
        .moveDown();

    doc
        .fontSize(12)
        .text(`Invoice Number: ${data.invoiceNumber}`)
        .text(`Date: ${new Date(data.date).toLocaleDateString()}`)
        .moveDown();

    // Divider
    doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown();

    // Details
    doc.fontSize(14).text('Details', { underline: true }).moveDown();

    Object.keys(data.details).forEach((key) => {
        doc
            .fontSize(12)
            .text(`${key}:`, { continued: true })
            .text(` ${data.details[key]}`, { align: 'right' });
    });

    doc.moveDown();

    // Total Amount Section
    doc
        .fontSize(16)
        // @ts-ignore - bold option is valid in recent pdfkit but types might be outdated or strict
        .text(`Total Amount: $${data.amount}`, { align: 'right' });

    // Footer
    doc
        .fontSize(10)
        .text('Thank you for using Txme.', 50, 700, { align: 'center', width: 500 });

    doc.end();
};

const getInvoiceForTransaction = async (transactionId: string, userId: string) => {
    const transaction = await WalletTransaction.findById(transactionId)
        .populate('from', 'fullName email')
        .populate('to', 'fullName email') as any;

    if (!transaction) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Transaction not found');
    }

    // Authorization check (Sender or Receiver)
    const isAuthorized =
        transaction.from?._id.toString() === userId ||
        transaction.to?._id.toString() === userId ||
        transaction.wallet?.toString() === userId;

    if (!isAuthorized) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to download this invoice');
    }

    const details: any = {
        'Transaction Type': transaction.type.toUpperCase(),
        'Status': transaction.status.toUpperCase(),
        'Platform': transaction.platform || 'N/A',
    };

    if (transaction.from) {
        details['Sender'] = transaction.from.fullName || transaction.from.email;
    }
    if (transaction.to) {
        details['Receiver'] = transaction.to.fullName || transaction.to.email;
    }
    if (transaction.reference) {
        details['Reference'] = transaction.reference;
    }

    return {
        invoiceNumber: transaction._id,
        date: transaction.createdAt,
        amount: transaction.amount,
        details
    };
};

const getInvoiceForAppointment = async (appointmentId: string, userId: string) => {
    const appointment = await Appointment.findById(appointmentId)
        .populate('customer', 'fullName email phone residentialAddress')
        .populate('provider', 'fullName email phone residentialAddress');

    if (!appointment) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
    }

    const isAuthorized =
        appointment.customer._id.toString() === userId ||
        appointment.provider._id.toString() === userId;

    if (!isAuthorized) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'You are not authorized to download this invoice');
    }

    // Removed invalid 'ticket' check
    if (appointment.status !== 'work_completed' && appointment.status !== 'review_pending') {
        // You might want to allow it, but usually invoice is for completed/paid work.
    }

    const details = {
        'Service': appointment.service,
        // @ts-ignore
        'Provider': appointment.provider.fullName,
        // @ts-ignore
        'Customer': appointment.customer.fullName,
        'Payment Method': appointment.paymentMethod?.toUpperCase() || 'N/A',
        'Total Hours': appointment.totalWorkedTime || 0,
        'Status': appointment.status.toUpperCase()
    };
    return {
        invoiceNumber: appointment._id,
        date: appointment.updatedAt, // Use completion date roughly
        amount: appointment.totalCost,
        details
    };
};


export const InvoiceService = {
    generateInvoicePDF,
    getInvoiceForTransaction,
    getInvoiceForAppointment
};
