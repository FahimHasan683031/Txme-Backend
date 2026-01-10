import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { InvoiceService } from './invoice.service';

const downloadTransactionInvoice = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    const invoiceData = await InvoiceService.getInvoiceForTransaction(id, userId);
    InvoiceService.generateInvoicePDF(invoiceData, res);
});

const downloadAppointmentInvoice = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user.id;

    const invoiceData = await InvoiceService.getInvoiceForAppointment(id, userId);
    InvoiceService.generateInvoicePDF(invoiceData, res);
});


export const InvoiceController = {
    downloadTransactionInvoice,
    downloadAppointmentInvoice
};
