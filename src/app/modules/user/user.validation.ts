import { z } from 'zod';

export const createUserZodValidationSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        email: z.string({ required_error: 'Email is required' }),
        phone: z.string({ required_error: 'Phone is required' }),
        role: z.string({ required_error: 'Role is required' })
    })
});