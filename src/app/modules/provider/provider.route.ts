import express from "express";
import { providerController } from "./provider.controller";
import auth from "../../middlewares/auth";
import { ADMIN_ROLES, USER_ROLES } from "../../../enums/user";

const router = express.Router();
// get popular providers
router.get(
    '/popular',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER, ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN),
    providerController.getPopularProviders
);
router.get('/:providerId/calendar', providerController.getProviderCalendar);
router.get('/:providerId/statistics', providerController.getDashboardStats);

export const providerRoute = router