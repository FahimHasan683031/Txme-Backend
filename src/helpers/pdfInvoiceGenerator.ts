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
        margin: 45,
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

    const brandColor = '#FF5A36';       // Txme Coral Accent
    const darkHeaderBg = '#1E293B';     // Slate 900
    const darkTextColor = '#0F172A';    // Slate 900 Text
    const grayTextColor = '#475569';    // Slate 600 Text
    const lightBgColor = '#F8FAFC';     // Slate 50 Light Background
    const borderColor = '#E2E8F0';      // Slate 200 Border

    const pageWidth = 595.28;
    const pageMargin = 45;
    const contentWidth = pageWidth - (pageMargin * 2); // 505.28 pt

    // 1. Top Decorative Brand Bar
    doc.rect(0, 0, pageWidth, 5).fill(brandColor);

    // 2. Logo & Header Section
    const headerY = 32;
    if (logoBuffer) {
        try {
            doc.image(logoBuffer, pageMargin, headerY, { height: 42 });
        } catch (e) {
            doc.fillColor(brandColor).fontSize(24).text('Txme', pageMargin, headerY + 5);
        }
    } else {
        doc.fillColor(brandColor).fontSize(26).text('Txme', pageMargin, headerY + 5);
    }

    // Invoice Meta (Top Right)
    const formattedInvoiceNo = payload.invoiceNumber.toString().slice(-8).toUpperCase();
    const formattedDate = new Date(payload.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    doc.fillColor(darkTextColor).fontSize(22).text('INVOICE', pageMargin, headerY, { align: 'right', width: contentWidth });
    doc.fillColor(grayTextColor).fontSize(9)
        .text(`INVOICE NO: #${formattedInvoiceNo}`, pageMargin, headerY + 28, { align: 'right', width: contentWidth })
        .text(`DATE OF ISSUE: ${formattedDate}`, pageMargin, headerY + 41, { align: 'right', width: contentWidth });

    // Divider Line
    const dividerY = headerY + 62;
    doc.moveTo(pageMargin, dividerY).lineTo(pageWidth - pageMargin, dividerY).strokeColor(borderColor).lineWidth(1).stroke();

    // 3. Issued By & Issued To Grid (Side-by-side)
    const cardY = dividerY + 16;
    const cardWidth = (contentWidth - 16) / 2; // 244.64 pt
    const cardHeight = 85;

    // Left Card (ISSUED BY)
    doc.roundedRect(pageMargin, cardY, cardWidth, cardHeight, 6).fillAndStroke(lightBgColor, borderColor);
    doc.fillColor(brandColor).fontSize(8).text('ISSUED BY', pageMargin + 14, cardY + 12);
    doc.fillColor(darkTextColor).fontSize(10).text(payload.billedFrom?.name || 'Txme Platform Services', pageMargin + 14, cardY + 24);
    doc.fillColor(grayTextColor).fontSize(9)
        .text(`Email: ${payload.billedFrom?.email || 'support@txme.app'}`, pageMargin + 14, cardY + 38)
        .text(`Role: ${payload.billedFrom?.role || 'Service Platform'}`, pageMargin + 14, cardY + 51)
        .text('Web: https://txme.app', pageMargin + 14, cardY + 64);

    // Right Card (ISSUED TO)
    const rightCardX = pageMargin + cardWidth + 16;
    doc.roundedRect(rightCardX, cardY, cardWidth, cardHeight, 6).fillAndStroke(lightBgColor, borderColor);
    doc.fillColor(brandColor).fontSize(8).text('ISSUED TO', rightCardX + 14, cardY + 12);
    doc.fillColor(darkTextColor).fontSize(10).text(payload.billedTo?.name || 'Valued Customer', rightCardX + 14, cardY + 24);
    doc.fillColor(grayTextColor).fontSize(9)
        .text(`Email: ${payload.billedTo?.email || 'N/A'}`, rightCardX + 14, cardY + 38)
        .text(`Phone: ${payload.billedTo?.phone || 'N/A'}`, rightCardX + 14, cardY + 51)
        .text(`Address: ${payload.billedTo?.address || 'Provided in App'}`, rightCardX + 14, cardY + 64);

    // 4. Structured Itemized Table
    let tableY = cardY + cardHeight + 22;
    const tableHeaderHeight = 24;

    // Table Header Bar (Dark Slate Background)
    doc.roundedRect(pageMargin, tableY, contentWidth, tableHeaderHeight, 4).fill(darkHeaderBg);
    doc.fillColor('#FFFFFF').fontSize(9)
        .text('DESCRIPTION / ATTRIBUTE', pageMargin + 14, tableY + 7)
        .text('VALUE / DETAILS', pageMargin + 200, tableY + 7, { width: contentWidth - 214, align: 'right' });

    tableY += tableHeaderHeight;

    // Table Rows
    const detailEntries = Object.entries(payload.details);
    const rowHeight = 22;

    detailEntries.forEach(([key, val], index) => {
        const rowBg = index % 2 === 0 ? '#FFFFFF' : lightBgColor;
        doc.rect(pageMargin, tableY, contentWidth, rowHeight).fillAndStroke(rowBg, borderColor);

        doc.fillColor(darkTextColor).fontSize(9)
            .text(key, pageMargin + 14, tableY + 6)
            .fillColor(grayTextColor)
            .text(String(val), pageMargin + 200, tableY + 6, { width: contentWidth - 214, align: 'right' });

        tableY += rowHeight;
    });

    // 5. Total Financial Summary Box (Right-aligned)
    tableY += 16;
    const totalBoxWidth = 210;
    const totalBoxX = pageWidth - pageMargin - totalBoxWidth;
    const totalBoxHeight = 54;

    doc.roundedRect(totalBoxX, tableY, totalBoxWidth, totalBoxHeight, 6).fillAndStroke('#FFF1EC', brandColor);

    doc.fillColor(grayTextColor).fontSize(9).text('SUBTOTAL:', totalBoxX + 14, tableY + 9);
    doc.fillColor(darkTextColor).fontSize(9).text(`€${Number(payload.amount).toFixed(2)}`, totalBoxX + 100, tableY + 9, { width: 96, align: 'right' });

    doc.fillColor(grayTextColor).fontSize(9).text('TAX / FEES:', totalBoxX + 14, tableY + 21);
    doc.fillColor(darkTextColor).fontSize(9).text('€0.00', totalBoxX + 100, tableY + 21, { width: 96, align: 'right' });

    // Inner Line inside Total Box
    doc.moveTo(totalBoxX + 14, tableY + 33).lineTo(totalBoxX + totalBoxWidth - 14, tableY + 33).strokeColor(brandColor).lineWidth(0.5).stroke();

    doc.fillColor(brandColor).fontSize(10).text('TOTAL AMOUNT:', totalBoxX + 14, tableY + 37);
    doc.fillColor(brandColor).fontSize(11).text(`€${Number(payload.amount).toFixed(2)}`, totalBoxX + 100, tableY + 36, { width: 96, align: 'right' });

    // 6. Professional Footer
    const footerY = 780;
    doc.moveTo(pageMargin, footerY - 14).lineTo(pageWidth - pageMargin, footerY - 14).strokeColor(borderColor).lineWidth(1).stroke();

    doc.fillColor(grayTextColor).fontSize(8)
        .text('Thank you for using Txme! For questions regarding this invoice, please contact support@txme.app', pageMargin, footerY, { align: 'center', width: contentWidth })
        .text('This is an official system-generated electronic receipt valid without signature.', pageMargin, footerY + 12, { align: 'center', width: contentWidth });

    doc.end();
    return doc;
};
