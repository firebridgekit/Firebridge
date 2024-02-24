import { object, array, string, number } from 'yup'

const validation = object({
  cancelUrl: string().optional(),
  cart: array(
    object({
      id: string().required(),
      quantity: number().integer().required(),
    }),
  ),
})

export default validation
