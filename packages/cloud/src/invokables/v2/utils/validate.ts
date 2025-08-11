import { HttpsError } from 'firebase-functions/v2/https'
import { z } from 'zod'

/**
 * @function validate
 * @description A function to validate a request body against a validation schema.
 * @template Data - The type of the data to validate.
 * @param {Data} body - The request body to validate.
 * @param {z.ZodObject<any>} [validationSchema] - The validation schema to use. If not provided, the function will not perform any validation.
 * @throws {HttpsError} - Throws an error if the validation fails. The error message will be the validation error message, or an empty string if no message is available.
 */
const validate = async <Data = any>(
  body: Data,
  validationSchema?: z.ZodObject<any>,
) => {
  try {
    if (validationSchema) await validationSchema.parseAsync(body)
  } catch (error) {
    let message = 'failed validation'
    if (error instanceof z.ZodError && error.issues && error.issues.length > 0) {
      const firstError = error.issues[0]
      if (firstError.message) {
        message = firstError.message
      } else if (firstError.path && firstError.path.length > 0) {
        message = `${firstError.path.join('.')}: ${firstError.code}`
      }
    } else if ((error as any)?.message) {
      message = (error as any).message
    }
    throw new HttpsError('failed-precondition', message)
  }
}

export default validate
