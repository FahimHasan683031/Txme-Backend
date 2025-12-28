"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Appointment = void 0;
const mongoose_1 = require("mongoose");
const AppointmentSchema = new mongoose_1.Schema({
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    provider: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    service: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    actualStartTime: {
        type: String,
        required: false,
    },
    actualEndTime: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "in_progress", "work_completed", "cancelled", "rejected", "awaiting_payment", "review_pending", "provider_review_pending", "customer_review_pending", "completed", "cashPayment", "cashReceived"],
        default: "pending",
    },
    totalWorkedTime: {
        type: Number,
        required: false,
    },
    totalCost: {
        type: Number,
        required: false,
    },
    address: {
        type: String,
        required: false,
    },
    paymentMethod: {
        type: String,
        enum: ["wallet", "card", "cash"],
        required: false,
    },
    reason: {
        type: String,
        required: false,
    },
}, {
    timestamps: true,
});
// Prevent double Appointments
AppointmentSchema.index({ provider: 1, date: 1, startTime: 1, endTime: 1 }, { unique: true });
AppointmentSchema.post('save', function (doc) {
    const { emitAppointmentUpdate } = require('../../../util/appointment.util');
    emitAppointmentUpdate(doc);
});
exports.Appointment = (0, mongoose_1.model)("Appointment", AppointmentSchema);
