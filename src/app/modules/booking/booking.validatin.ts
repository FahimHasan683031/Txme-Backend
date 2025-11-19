// src/modules/booking/booking.validation.ts
import { z } from "zod";

// Create Booking Validation
export const createBookingZod = z.object({
  body: z.object({
    provider: z.string().min(1, "Provider ID is required"),
    service: z.string().min(1, "Service is required"),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    price: z.number().min(0, "Price must be positive"),
    address: z.string().min(1, "Address is required").optional(),
  }),
});

// Update Booking Status Validation
export const updateBookingStatusZod = z.object({
  body: z.object({
    status: z.enum(["confirmed", "completed", "cancelled"]),
  }),
});