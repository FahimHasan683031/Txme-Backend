"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRoutes = void 0;
// wallet.route.ts
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const wallet_controller_1 = require("./wallet.controller");
const stripe_controller_1 = require("../stripe/stripe.controller");
const router = express_1.default.Router();
// Get my wallet
router.get("/my-wallet", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), wallet_controller_1.WalletController.getmyWallet);
// Stripe Payment Routes (Logic in Stripe Module)
router.post("/create-payment-intent", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), stripe_controller_1.StripeController.createTopUpPaymentIntent);
router.post("/verify-payment", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), stripe_controller_1.StripeController.verifyTopUpPayment);
// Regular Wallet Routes
router.post("/topup", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), wallet_controller_1.WalletController.topUp);
router.post("/send", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), wallet_controller_1.WalletController.sendMoney);
router.post("/withdraw", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), wallet_controller_1.WalletController.withdraw);
exports.WalletRoutes = router;
