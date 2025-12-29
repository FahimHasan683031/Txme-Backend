"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const stripe_controller_1 = require("./stripe.controller");
const router = express_1.default.Router();
router.post("/account-session", (0, auth_1.default)(user_1.USER_ROLES.PROVIDER), stripe_controller_1.StripeController.createAccountSession);
router.get("/account-status", (0, auth_1.default)(user_1.USER_ROLES.PROVIDER, user_1.USER_ROLES.CUSTOMER), stripe_controller_1.StripeController.getAccountStatus);
router.post("/create-appointment-payment-intent/:appointmentId", (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER), stripe_controller_1.StripeController.createAppointmentPaymentIntent);
exports.StripeRoutes = router;
