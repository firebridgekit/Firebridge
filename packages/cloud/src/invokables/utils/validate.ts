import { https } from 'firebase-functions'

import { BodyValidationSchema } from '../type'

/**
 * @function validate
 * @description A function to validate a request body against a validation schema.
 * @template Data - The type of the data to validate.
 * @param {Data} body - The request body to validate.
 * @param {BodyValidationSchema} [validationSchema] - The validation schema to use. If not provided, the function will not perform any validation.
 * @throws {https.HttpsError} - Throws an error if the validation fails. The error message will be the validation error message, or an empty string if no message is available.
 */
const validate = async <Data = any>(
  body: Data,
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

export default validate
