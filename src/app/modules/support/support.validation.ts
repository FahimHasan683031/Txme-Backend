import { z } from "zod";

export const supportZodValidationSchema = z.object({
    body: z.object({
        message: z.string({required_error: "Message is required"})
    })
})