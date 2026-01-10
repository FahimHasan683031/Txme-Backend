import { z } from "zod";

// Create Appointment Validation
export const createAppointmentZod = z.object({
  body: z.object({
    provider: z.string().min(1, "Provider ID is required"),
    service: z.string().min(1, "Service is required"),
    date: z.string().min(1, "Date is required"),
    paymentMethod: z.enum(["wallet", "card", "cash"]).optional(),
    note: z.string().optional(),
  }),
});

// Update Appointment Status Validation
export const updateAppointmentStatusZod = z.object({
  body: z.object({
    status: z.enum(["confirmed", "completed", "cancelled"]),
  }),
});