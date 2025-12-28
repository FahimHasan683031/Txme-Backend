"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const appointment_service_1 = require("./appointment.service");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const createAppointment = (0, catchAsync_1.default)(async (req, res) => {
    const Appointment = await appointment_service_1.AppointmentService.createAppointment(req.user.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Appointment created successfully',
        data: Appointment,
    });
});
const payWithWallet = (0, catchAsync_1.default)(async (req, res) => {
    const { appointmentId } = req.params;
    const userId = req.user.id; // Assuming user.id is available in req.user
    const result = await appointment_service_1.AppointmentService.payWithWallet(appointmentId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Appointment paid with wallet successfully',
        data: result,
    });
});
const getMyAppointments = (0, catchAsync_1.default)(async (req, res) => {
    const result = await appointment_service_1.AppointmentService.getMyAppointments(req.user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Appointments retrieved successfully",
        data: result,
    });
});
const getAllAppointments = (0, catchAsync_1.default)(async (req, res) => {
    const result = await appointment_service_1.AppointmentService.getAllAppointmentsFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "All appointments retrieved successfully",
        data: result,
    });
});
const updateAppointmentStatus = (0, catchAsync_1.default)(async (req, res) => {
    const { appointmentId } = req.params;
    const { status, reason, ...data } = req.body;
    const { id: userId, role: userRole } = req.user;
    const result = await appointment_service_1.AppointmentService.updateAppointmentStatus(appointmentId, status, userId, userRole, reason, data);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Appointment status updated successfully",
        data: result,
    });
});
exports.AppointmentController = {
    createAppointment,
    payWithWallet,
    getMyAppointments,
    getAllAppointments,
    updateAppointmentStatus
};
