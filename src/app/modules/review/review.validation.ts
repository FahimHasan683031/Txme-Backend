import { z } from "zod";

export const createReviewZod = z.object({
  body: z.object({
    reviewee: z.string(),
    service: z.string(),
    appointment: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  }),
});

export const updateReviewZod = z.object({
  body: z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
  }),
});
