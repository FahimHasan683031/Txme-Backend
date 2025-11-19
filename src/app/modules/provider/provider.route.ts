import express from "express";
import { providerController } from "./provider.controller";

const router = express.Router();
router.get('/:providerId/calendar', providerController.getProviderCalendar);

export const providerRoute =router