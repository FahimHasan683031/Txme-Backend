// wallet.route.ts
import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { WalletController } from "./wallet.controller";
import { StripeController } from "../stripe/stripe.controller";

import { WalletValidation } from "./wallet.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

// Get my wallet
router.get(
    "/my-wallet",
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    WalletController.getmyWallet
);

// Regular Wallet Routes
router.post(
    "/topup",
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    StripeController.createTopUpPaymentIntent
);

router.post(
    "/verify-payment",
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    StripeController.verifyTopUpPayment
);

router.post(
    "/send",
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    // validateRequest(WalletValidation.sendMoney),
    WalletController.sendMoney
);

router.post(
    "/withdraw",
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER),
    validateRequest(WalletValidation.withdraw),
    WalletController.withdraw
);

export const WalletRoutes = router;
