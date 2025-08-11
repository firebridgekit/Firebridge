import { z } from 'zod'

const validation = z.object({
  cancelUrl: z.string().optional(),
  cart: z.array(
    z.object({
      id: z.string(),
      quantity: z.number().int(),
    }),
  ).optional(),
})

export default validation
