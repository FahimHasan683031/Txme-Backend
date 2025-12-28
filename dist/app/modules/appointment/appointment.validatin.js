"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppointmentStatusZod = exports.createAppointmentZod = void 0;
const zod_1 = require("zod");
// Create Appointment Validation
exports.createAppointmentZod = zod_1.z.object({
    body: zod_1.z.object({
        provider: zod_1.z.string().min(1, "Provider ID is required"),
        service: zod_1.z.string().min(1, "Service is required"),
        date: zod_1.z.string().min(1, "Date is required"),
        paymentMethod: zod_1.z.enum(["wallet", "card", "cash"]).optional(),
    }),
});
// Update Appointment Status Validation
exports.updateAppointmentStatusZod = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["confirmed", "completed", "cancelled"]),
    }),
});
