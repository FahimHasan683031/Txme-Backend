// service.validation.ts
import { z } from "zod";

// Base service validation (common for all levels)
const baseServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  image: z.string().min(1, "Image URL is required"),
  isActive: z.boolean().default(true),
});

// Create service validation
export const createServiceZod = z.object({
  body: baseServiceSchema.extend({
    parent: z.string().optional().nullable(),
  }).strict(),
});

// Update service validation
export const updateServiceZod = z.object({
  body: baseServiceSchema.partial(), 
});




