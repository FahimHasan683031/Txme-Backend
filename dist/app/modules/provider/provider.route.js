"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerRoute = void 0;
const express_1 = __importDefault(require("express"));
const provider_controller_1 = require("./provider.controller");
const router = express_1.default.Router();
// get popular providers
router.get('/popular', provider_controller_1.providerController.getPopularProviders);
router.get('/:providerId/calendar', provider_controller_1.providerController.getProviderCalendar);
exports.providerRoute = router;
