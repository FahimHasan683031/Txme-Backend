import express from "express";
import auth from "../../middlewares/auth";
import { ADMIN_ROLES, USER_ROLES } from "../../../enums/user";
import { PromotionController } from "./promotion.controller";

const router = express.Router();

router.get(
    "/packages",
    auth(USER_ROLES.PROVIDER,ADMIN_ROLES.ADMIN,ADMIN_ROLES.SUPER_ADMIN),
    PromotionController.getAllPackages
);

router.post(
    "/verify-purchase",
    auth(USER_ROLES.PROVIDER),
    PromotionController.verifyPurchase
);

// --- Admin Routes ---
router.post(
    "/create-package",
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    PromotionController.createPackage
);

router.patch(
    "/update-package/:id",
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    PromotionController.updatePackage
);

router.delete(
    "/delete-package/:id",
    auth(ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    PromotionController.deletePackage
);

export const PromotionRoutes = router;
