"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const QueryBuilder_1 = __importDefault(require("../../../helpers/QueryBuilder"));
const transaction_model_1 = require("./transaction.model");
const wallet_model_1 = require("../wallet/wallet.model");
const ApiErrors_1 = __importDefault(require("../../../errors/ApiErrors"));
const http_status_codes_1 = require("http-status-codes");
const pdfkit_1 = __importDefault(require("pdfkit"));
const getAllTransactionsFromDB = async (query) => {
    const transactionQuery = new QueryBuilder_1.default(transaction_model_1.WalletTransaction.find()
        .populate("wallet", "balance")
        .populate("from", "fullName profilePicture email")
        .populate("to", "fullName profilePicture email"), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = await transactionQuery.modelQuery;
    const meta = await transactionQuery.getPaginationInfo();
    return { result, meta };
};
const getMyTransactionsFromDB = async (user, query) => {
    const { id } = user;
    // Find user's wallet
    const wallet = await wallet_model_1.Wallet.findOne({ user: id });
    if (!wallet) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Wallet not found for this user");
    }
    // Filter by user's wallet ID
    query.wallet = wallet._id.toString();
    const transactionQuery = new QueryBuilder_1.default(transaction_model_1.WalletTransaction.find()
        .populate("wallet", "balance")
        .populate("from", "fullName profilePicture email")
        .populate("to", "fullName profilePicture email"), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    const result = await transactionQuery.modelQuery;
    const meta = await transactionQuery.getPaginationInfo();
    return { result, meta };
};
const getTransactionByReference = async (referenceId) => {
    const result = await transaction_model_1.WalletTransaction.findOne({ reference: referenceId })
        .populate("wallet", "balance")
        .populate("from", "fullName profilePicture email")
        .populate("to", "fullName profilePicture email");
    if (!result) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Transaction not found");
    }
    return result;
};
// Logic for generating a transaction invoice PDF
const generateInvoicePDF = async (transactionId) => {
    var _a, _b, _c, _d;
    const transaction = await transaction_model_1.WalletTransaction.findById(transactionId)
        .populate("from", "fullName email")
        .populate("to", "fullName email");
    if (!transaction) {
        throw new ApiErrors_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Transaction not found");
    }
    const doc = new pdfkit_1.default({ margin: 50 });
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
    doc.fontSize(10).text(((_a = transaction.from) === null || _a === void 0 ? void 0 : _a.fullName) || "System", 50, currentY + 20);
    doc.text(((_b = transaction.from) === null || _b === void 0 ? void 0 : _b.email) || "", 50, currentY + 35);
    doc.fontSize(14).text("To:", 350, currentY);
    doc.fontSize(10).text(((_c = transaction.to) === null || _c === void 0 ? void 0 : _c.fullName) || "System", 350, currentY + 20);
    doc.text(((_d = transaction.to) === null || _d === void 0 ? void 0 : _d.email) || "", 350, currentY + 35);
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
exports.TransactionService = {
    getAllTransactionsFromDB,
    getMyTransactionsFromDB,
    getTransactionByReference,
    generateInvoicePDF
};
