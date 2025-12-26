import { Schema, model } from "mongoose";
import { IAppointment } from "./appointment.interface";


const AppointmentSchema = new Schema<IAppointment>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
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
      enum: ["pending", "accepted", "in_progress", "work_completed", "cancelled", "rejected", "awaiting_payment", "review_pending", "provider_review_pending", "customer_review_pending", "completed"],
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
  },
  {
    timestamps: true,
  }
);

// Prevent double Appointments
AppointmentSchema.index(
  { provider: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

AppointmentSchema.post('save', function (doc) {
  const { emitAppointmentUpdate } = require('../../../util/appointment.util');
  emitAppointmentUpdate(doc);
});

export const Appointment = model<IAppointment>("Appointment", AppointmentSchema);