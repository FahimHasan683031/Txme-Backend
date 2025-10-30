import { z } from 'zod'

export const categoryZodValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Category name is required' }),
    image: z.string({ required_error: 'Category image is required' })
  })
})
