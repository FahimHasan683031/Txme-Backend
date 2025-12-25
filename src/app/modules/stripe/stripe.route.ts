import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { StripeController } from "./stripe.controller";

const router = express.Router();

router.post(
    "/onboard",
    auth(USER_ROLES.PROVIDER, USER_ROLES.CUSTOMER),
    StripeController.createStripeConnectAccount
);

router.post(
    "/create-appointment-payment-intent/:appointmentId",
    auth(USER_ROLES.CUSTOMER),
    StripeController.createAppointmentPaymentIntent
);

export const StripeRoutes = router;
