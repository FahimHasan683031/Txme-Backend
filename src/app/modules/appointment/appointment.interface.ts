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
  | "cashPayment"
  | "cashReceived";

export interface IAppointment extends Document {
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  service: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: AppointmentStatus;
  totalWorkedTime?: number;
  totalCost?: number;
  address?: string;
  paymentMethod?: 'wallet' | 'card' | 'cash';
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}
