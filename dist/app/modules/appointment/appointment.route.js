"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const appointment_controller_1 = require("./appointment.controller");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
router.post('/create', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER), appointment_controller_1.AppointmentController.createAppointment);
router.get('/my-appointments', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), appointment_controller_1.AppointmentController.getMyAppointments);
router.get('/', (0, auth_1.default)(user_1.ADMIN_ROLES.ADMIN, user_1.ADMIN_ROLES.SUPER_ADMIN), appointment_controller_1.AppointmentController.getAllAppointments);
router.patch('/update-status/:appointmentId', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER, user_1.USER_ROLES.PROVIDER), appointment_controller_1.AppointmentController.updateAppointmentStatus);
router.post('/pay-with-wallet/:appointmentId', (0, auth_1.default)(user_1.USER_ROLES.CUSTOMER), appointment_controller_1.AppointmentController.payWithWallet);
exports.AppointmentRoutes = router;
