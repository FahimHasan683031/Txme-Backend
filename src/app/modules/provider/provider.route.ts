import express from "express";
import { providerController } from "./provider.controller";

const router = express.Router();
// get popular providers
router.get('/popular', providerController.getPopularProviders);
router.get('/:providerId/calendar', providerController.getProviderCalendar);
router.get('/:providerId/statistics', providerController.getDashboardStats);

export const providerRoute = router