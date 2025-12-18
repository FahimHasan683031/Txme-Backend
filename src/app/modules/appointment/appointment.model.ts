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
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "rejected", "awaiting_payment", "paid", "no_show"],
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

export const Appointment = model<IAppointment>("Appointment", AppointmentSchema);