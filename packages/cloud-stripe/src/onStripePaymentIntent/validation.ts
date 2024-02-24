import { object, array, string, number } from 'yup'

const validation = object({
  cart: array(
    object({
      id: string().required(),
      quantity: number().integer().required(),
    }),
  ),
})

export default validation
