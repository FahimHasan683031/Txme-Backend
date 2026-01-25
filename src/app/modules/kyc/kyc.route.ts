import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { KycController } from "./kyc.controller";

const router = express.Router();

// --- Didit Routes ---
router.post(
    "/didit-session",
    auth(USER_ROLES.PROVIDER, USER_ROLES.CUSTOMER),
    KycController.createDiditSession
);

router.post(
    "/didit-webhook",
    KycController.handleDiditWebhook
);

router.get(
    "/redirect",
    KycController.handleDiditRedirect
);

export const KycRoutes = router;
