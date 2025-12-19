// wallet.route.ts
import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { WalletController } from "./wallet.controller";

const router = express.Router();

// Stripe Payment Routes
router.post(
    "/create-payment-intent",
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    WalletController.createTopUpPaymentIntent
);

router.post(
    "/verify-payment",
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    WalletController.verifyTopUpPayment
);

// Regular Wallet Routes
router.post("/topup", auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER), WalletController.topUp);
router.post("/send", auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER), WalletController.sendMoney);
router.post("/withdraw", auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER), WalletController.withdraw);

export const WalletRoutes = router;
