import { HttpsError } from 'firebase-functions/v2/https'
import { AnyObjectSchema } from 'yup'

/**
 * @function validate
 * @description A function to validate a request body against a validation schema.
 * @template Data - The type of the data to validate.
 * @param {Data} body - The request body to validate.
 * @param {AnyObjectSchema} [validationSchema] - The validation schema to use. If not provided, the function will not perform any validation.
 * @throws {HttpsError} - Throws an error if the validation fails. The error message will be the validation error message, or an empty string if no message is available.
 */
const validate = async <Data = any>(
  body: Data,
  validationSchema?: AnyObjectSchema,
) => {
  try {
    if (validationSchema) await validationSchema.validate(body)
  } catch (error) {
    const message = (error as any)?.message || 'failed validation'
    throw new HttpsError('failed-precondition', message)
  }
}

export default validate
