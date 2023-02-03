import { https } from 'firebase-functions'

import { BodyValidationSchema } from '../type'

export const validate = async (
  body: any,
  validationSchema?: BodyValidationSchema,
) => {
  try {
    if (validationSchema) {
      await validationSchema.validate(body)
    }
  } catch (error) {
    throw new https.HttpsError(
      'failed-precondition',
      (error as any)?.message || '',
    )
  }
}
