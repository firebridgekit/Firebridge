/**
 * A mapping of error codes to their corresponding error messages.
 */
const errorCodeMessages = {
  'auth/invalid-email': {
    email: 'Sorry, that email is invalid.',
  },
  'auth/user-disabled': {
    email: 'Sorry, that account is disabled.',
  },
  'auth/user-not-found': {
    email: "There isn't a user with that email.",
  },
  'auth/wrong-password': {
    password: "You've entered an incorrect password.",
  },
  'auth/email-already-in-use': {
    email: 'There is already an account with this email.',
  },
  unknown: {
    email: 'Sorry, something went wrong.',
  },
} as const

/**
 * Type representing the keys of the errorCodeMessages object.
 */
type ErrorCode = keyof typeof errorCodeMessages

/**
 * @function formErrorsForCode
 * Returns the error messages corresponding to a given error code.
 *
 * @param {ErrorCode} code - The error code.
 * @returns {Object} The error messages for the given code, or the default error messages if the code is not found.
 */
export const formErrorsForCode = (code: ErrorCode) =>
  errorCodeMessages[code] || errorCodeMessages.unknown
