import PDFDocument from 'pdfkit';
import { Response } from 'express';
import https from 'node:https';

let cachedLogoBuffer: Buffer | null = null;

// Helper to fetch and cache logo buffer
const fetchLogoBuffer = (): Promise<Buffer | null> => {
    if (cachedLogoBuffer) return Promise.resolve(cachedLogoBuffer);
    const logoUrl = "https://texme-media-bucket.s3.us-east-1.amazonaws.com/serviceimage/1770608892815-1770608892522-7m6bfj.png";

    return new Promise((resolve) => {
        https.get(logoUrl, (res) => {
            if (res.statusCode !== 200) return resolve(null);
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                cachedLogoBuffer = Buffer.concat(chunks);
                resolve(cachedLogoBuffer);
            });
        }).on('error', () => resolve(null));
    });
};

export interface IInvoicePDFPayload {
    invoiceNumber: string;
    date: Date | string;
    amount: number;
    status?: string;
    paymentMethod?: string;
    billedFrom?: {
        name?: string;
        email?: string;
        role?: string;
    };
    billedTo?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    details: Record<string, any>;
}

export const buildProfessionalInvoicePDF = async (payload: IInvoicePDFPayload, res?: Response): Promise<InstanceType<typeof PDFDocument>> => {
    const logoBuffer = await fetchLogoBuffer();

    const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
            Title: `Invoice #${payload.invoiceNumber}`,
            Author: 'Txme Technologies',
        }
    });

    if (res) {
        const filename = `invoice-${payload.invoiceNumber}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);
    }

    const brandColor = '#FF5A36';
    const darkTextColor = '#0F172A';
    const grayTextColor = '#475569';
    const lightBgColor = '#F8FAFC';
    const borderColor = '#E2E8F0';

    // 1. Top Decorative Brand Bar
    doc.rect(0, 0, 595.28, 6).fill(brandColor);

    // 2. Logo & Header Title Section
    let headerY = 30;
    if (logoBuffer) {
        try {
            doc.image(logoBuffer, 40, headerY, { height: 45 });
        } catch (e) {
            doc.fillColor(brandColor).fontSize(24).text('Txme', 40, headerY, { bold: true } as any);
        }
    } else {
        doc.fillColor(brandColor).fontSize(26).text('Txme', 40, headerY, { bold: true } as any);
    }

    // Invoice Meta Header (Top Right)
    doc.fillColor(darkTextColor).fontSize(22).text('INVOICE', 350, headerY, { align: 'right', bold: true } as any);
    doc.fillColor(grayTextColor).fontSize(9)
        .text(`INVOICE NO: #${payload.invoiceNumber.toString().slice(-8).toUpperCase()}`, 350, headerY + 28, { align: 'right' })
        .text(`DATE: ${new Date(payload.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 350, headerY + 40, { align: 'right' });

    // Divider Line
    headerY += 65;
    doc.moveTo(40, headerY).lineTo(555, headerY).strokeColor(borderColor).lineWidth(1).stroke();

    // 3. Billed From & Billed To Cards (Side-by-side)
    const cardY = headerY + 15;
    const cardWidth = 245;
    const cardHeight = 85;

    // Billed From Card (Left)
    doc.roundedRect(40, cardY, cardWidth, cardHeight, 6).fillAndStroke(lightBgColor, borderColor);
    doc.fillColor(brandColor).fontSize(8).text('BILLED FROM', 52, cardY + 10, { bold: true } as any);
    doc.fillColor(darkTextColor).fontSize(10).text(payload.billedFrom?.name || 'Txme Platform Services', 52, cardY + 22, { bold: true } as any);
    doc.fillColor(grayTextColor).fontSize(9)
        .text(`Email: ${payload.billedFrom?.email || 'support@txme.app'}`, 52, cardY + 36)
        .text(`Role/Type: ${payload.billedFrom?.role || 'Service Platform'}`, 52, cardY + 48)
        .text('Web: https://txme.app', 52, cardY + 60);

    // Billed To Card (Right)
    doc.roundedRect(310, cardY, cardWidth, cardHeight, 6).fillAndStroke(lightBgColor, borderColor);
    doc.fillColor(brandColor).fontSize(8).text('BILLED TO', 322, cardY + 10, { bold: true } as any);
    doc.fillColor(darkTextColor).fontSize(10).text(payload.billedTo?.name || 'Valued Customer', 322, cardY + 22, { bold: true } as any);
    doc.fillColor(grayTextColor).fontSize(9)
        .text(`Email: ${payload.billedTo?.email || 'N/A'}`, 322, cardY + 36)
        .text(`Phone: ${payload.billedTo?.phone || 'N/A'}`, 322, cardY + 48)
        .text(`Address: ${payload.billedTo?.address || 'Provided in App'}`, 322, cardY + 60);

    // 4. Details & Service Table Section
    let tableY = cardY + cardHeight + 25;

    // Table Header
    doc.roundedRect(40, tableY, 515, 22, 4).fill(brandColor);
    doc.fillColor('#FFFFFF').fontSize(9)
        .text('DESCRIPTION / ATTRIBUTE', 52, tableY + 6, { bold: true } as any)
        .text('VALUE / DETAILS', 300, tableY + 6, { width: 240, align: 'right', bold: true } as any);

    tableY += 22;

    // Table Rows
    const detailEntries = Object.entries(payload.details);
    detailEntries.forEach(([key, val], index) => {
        const rowBg = index % 2 === 0 ? '#FFFFFF' : lightBgColor;
        doc.rect(40, tableY, 515, 22).fillAndStroke(rowBg, borderColor);

        doc.fillColor(darkTextColor).fontSize(9)
            .text(key, 52, tableY + 6)
            .fillColor(grayTextColor)
            .text(String(val), 300, tableY + 6, { width: 240, align: 'right' });

        tableY += 22;
    });

    // 5. Total Amount Box (Callout Box)
    tableY += 15;
    const totalBoxWidth = 220;
    const totalBoxX = 335;

    doc.roundedRect(totalBoxX, tableY, totalBoxWidth, 55, 6).fillAndStroke('#FFF1EC', brandColor);

    doc.fillColor(grayTextColor).fontSize(9).text('SUBTOTAL:', totalBoxX + 15, tableY + 10);
    doc.fillColor(darkTextColor).fontSize(9).text(`€${Number(payload.amount).toFixed(2)}`, totalBoxX + 110, tableY + 10, { width: 95, align: 'right' });

    doc.fillColor(grayTextColor).fontSize(9).text('TAX / FEES:', totalBoxX + 15, tableY + 22);
    doc.fillColor(darkTextColor).fontSize(9).text('€0.00', totalBoxX + 110, tableY + 22, { width: 95, align: 'right' });

    doc.moveTo(totalBoxX + 15, tableY + 34).lineTo(totalBoxX + 205, tableY + 34).strokeColor(brandColor).lineWidth(0.5).stroke();

    doc.fillColor(brandColor).fontSize(11).text('TOTAL AMOUNT:', totalBoxX + 15, tableY + 38, { bold: true } as any);
    doc.fillColor(brandColor).fontSize(12).text(`€${Number(payload.amount).toFixed(2)}`, totalBoxX + 110, tableY + 37, { width: 95, align: 'right', bold: true } as any);

    // 6. Professional Footer
    const footerY = 780;
    doc.moveTo(40, footerY - 15).lineTo(555, footerY - 15).strokeColor(borderColor).lineWidth(1).stroke();

    doc.fillColor(grayTextColor).fontSize(8)
        .text('Thank you for choosing Txme! For questions regarding this invoice, please contact support@txme.app', 40, footerY, { align: 'center', width: 515 })
        .text('This is a system-generated electronic receipt valid without signature.', 40, footerY + 12, { align: 'center', width: 515 });

    doc.end();
    return doc;
};
