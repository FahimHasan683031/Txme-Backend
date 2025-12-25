// src/modules/Appointment/Appointment.model.ts
import { Types } from "mongoose";

export type AppointmentStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "work_completed"
  | "cancelled"
  | "rejected"
  | "awaiting_payment"
  | "review_pending"
  | "provider_review_pending"
  | "customer_review_pending"
  | "completed"
  | "no_show";

export interface IAppointment extends Document {
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  service: string;
  date: Date;
  startTime?: string; // Booked slot start time in "HH:MM" format
  endTime?: string;   // Booked slot end time in "HH:MM" format
  actualStartTime?: string; // Real start time in "HH:MM" format
  actualEndTime?: string;   // Real end time in "HH:MM" format
  status: AppointmentStatus;
  totalWorkedTime?: number; // in minutes
  totalCost?: number;
  address?: string;
  paymentMethod?: 'wallet' | 'card' | 'cash';
  createdAt: Date;
  updatedAt: Date;
}
