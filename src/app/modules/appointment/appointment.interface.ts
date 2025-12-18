// src/modules/Appointment/Appointment.model.ts
import {Types } from "mongoose";

export type AppointmentStatus = 
  | "pending"          // Customer requested
  | "accepted"         // Provider accepted
  | "confirmed"        // Slot officially booked
  | "in_progress"      // Provider started service
  | "completed"        // Service completed
  | "cancelled"        // Cancelled by anyone
  | "rejected"         // Provider rejected
  | "awaiting_payment" // Waiting for customer payment
  | "paid"             // Payment completed
  | "no_show"; 

 
export interface IAppointment extends Document {
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  service: string;
  date: Date;
  startTime?: Date; // "HH:MM" format
  endTime?: Date;   // "HH:MM" format
  status: AppointmentStatus;
  totalWorkedTime?: number; // in minutes
  totalCost?: number;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
