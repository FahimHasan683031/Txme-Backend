"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.providerRoute = void 0;
const express_1 = __importDefault(require("express"));
const provider_controller_1 = require("./provider.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
// get popular providers
router.get('/popular', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER, user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN), provider_controller_1.providerController.getPopularProviders);
router.get('/:providerId/calendar', provider_controller_1.providerController.getProviderCalendar);
router.get('/:providerId/statistics', provider_controller_1.providerController.getDashboardStats);
exports.providerRoute = router;
