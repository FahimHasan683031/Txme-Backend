import express from "express";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import { KycController } from "./kyc.controller";

const router = express.Router();

router.get(
    "/token",
    auth(USER_ROLES.PROVIDER, USER_ROLES.CUSTOMER),
    KycController.getMobileToken
);

router.post(
    "/webhook",
    // Webhooks usually don't have user auth, but have signature verification
    KycController.handleWebhook
);

router.get(
    "/status",
    auth(USER_ROLES.PROVIDER, USER_ROLES.CUSTOMER),
    KycController.getKycStatus
);

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

export const KycRoutes = router;
