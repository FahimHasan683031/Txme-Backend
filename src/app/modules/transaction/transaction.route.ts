import express from "express";
import auth from "../../middlewares/auth";
import { ADMIN_ROLES, USER_ROLES } from "../../../enums/user";
import { TransactionController } from "./transaction.controller";

const router = express.Router();

// Get personal transactions (Customer & Provider)
router.get(
    "/my-transactions",
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    TransactionController.getMyTransactions
);

// Get all transactions (Admin & Super Admin)
router.get(
    "/",
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    TransactionController.getAllTransactions
);

export const TransactionRoutes = router;
