import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../../../helpers/QueryBuilder";
import { WalletTransaction } from "./transaction.model";
import { Wallet } from "../wallet/wallet.model";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import PDFDocument from "pdfkit";

const getAllTransactionsFromDB = async (query: Record<string, any>) => {
    const transactionQuery = new QueryBuilder(
        WalletTransaction.find()
            .populate("wallet", "balance")
            .populate("from", "fullName profilePicture email")
            .populate("to", "fullName profilePicture email"),
        query
    )
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await transactionQuery.modelQuery;
    const meta = await transactionQuery.getPaginationInfo();

    return { result, meta };
};

const getMyTransactionsFromDB = async (user: JwtPayload, query: Record<string, any>) => {
    const { id } = user;

    // Find user's wallet
    const wallet = await Wallet.findOne({ user: id });
    if (!wallet) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Wallet not found for this user");
    }

    // Filter by user's wallet ID
    query.wallet = wallet._id.toString();

    const transactionQuery = new QueryBuilder(
        WalletTransaction.find()
            .populate("wallet", "balance")
            .populate("from", "fullName profilePicture email")
            .populate("to", "fullName profilePicture email"),
        query
    )
        .filter()
        .sort()
        .paginate()
        .fields();

    const result = await transactionQuery.modelQuery;
    const meta = await transactionQuery.getPaginationInfo();

    return { result, meta };
};

const getTransactionByReference = async (referenceId: string) => {
    const result = await WalletTransaction.findOne({ reference: referenceId })
        .populate("wallet", "balance")
        .populate("from", "fullName profilePicture email")
        .populate("to", "fullName profilePicture email");

    if (!result) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
    }

    return result;
};

// Logic for generating a transaction invoice PDF
const generateInvoicePDF = async (transactionId: string): Promise<PDFKit.PDFDocument> => {
    const transaction = await WalletTransaction.findById(transactionId)
        .populate("from", "fullName email")
        .populate("to", "fullName email");

    if (!transaction) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
    }

    const doc = new PDFDocument({ margin: 50 });

    // Header
    doc.fillColor("#444444")
        .fontSize(20)
        .text("TRANSACTION INVOICE", { align: "center" })
        .moveDown();

    doc.strokeColor("#eeeeee")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown();

    // Transaction Details
    doc.fontSize(12).fillColor("#000000");
    const rowTop = doc.y;

    doc.text(`Reference: ${transaction.reference || "N/A"}`, 50, rowTop);
    // @ts-ignore - createdAt exists because of timestamps: true
    doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString()}`, 350, rowTop);
    doc.moveDown();

    doc.text(`Type: ${transaction.type.toUpperCase()}`);
    doc.text(`Status: ${transaction.status.toUpperCase()}`);
    doc.moveDown();

    // From/To
    const currentY = doc.y;

    doc.fontSize(14).text("From:", 50, currentY);
    doc.fontSize(10).text((transaction.from as any)?.fullName || "System", 50, currentY + 20);
    doc.text((transaction.from as any)?.email || "", 50, currentY + 35);

    doc.fontSize(14).text("To:", 350, currentY);
    doc.fontSize(10).text((transaction.to as any)?.fullName || "System", 350, currentY + 20);
    doc.text((transaction.to as any)?.email || "", 350, currentY + 35);

    doc.moveDown(4);

    // Amount Table Header
    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 20).fill("#f6f6f6").stroke("#eeeeee");
    doc.fillColor("#333333").fontSize(10).text("Description", 60, tableTop + 5);
    doc.text("Amount", 450, tableTop + 5, { width: 90, align: "right" });

    // Amount Table Content
    doc.fillColor("#000000").text(`Wallet Transaction - ${transaction.type}`, 60, tableTop + 30);
    doc.text(`$${transaction.amount.toFixed(2)}`, 450, tableTop + 30, { width: 90, align: "right" });

    // Footer
    doc.fontSize(10)
        .fillColor("#777777")
        .text("Thank you for using our service.", 50, 700, { align: "center", width: 500 });

    doc.end();
    return doc;
};

export const TransactionService = {
    getAllTransactionsFromDB,
    getMyTransactionsFromDB,
    getTransactionByReference,
    generateInvoicePDF
};
