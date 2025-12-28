"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const transaction_controller_1 = require("./transaction.controller");
const router = express_1.default.Router();
// Get personal transactions (Customer & Provider)
router.get("/my-transactions", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), transaction_controller_1.TransactionController.getMyTransactions);
// Get all transactions (Admin & Super Admin)
router.get("/", (0, auth_1.default)(user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN), transaction_controller_1.TransactionController.getAllTransactions);
exports.TransactionRoutes = router;
