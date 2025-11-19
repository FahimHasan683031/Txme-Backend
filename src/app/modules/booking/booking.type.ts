// src/modules/booking/booking.model.ts
import {Types } from "mongoose";

export interface IBooking extends Document {
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  service: string;
  date: Date;
  startTime?: string; // "HH:MM" format
  endTime?: string;   // "HH:MM" format
  status: "pending" | "confirmed" | "completed" | "cancelled";
  price: number;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}
