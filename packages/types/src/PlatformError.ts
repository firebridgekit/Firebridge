/**
 * @typedef BaseErrorCode
 * @description Represents the base error codes that are common to all apps on the platform.
 * @type {string[]}
 */
export type BaseErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

// We export the list of base error codes for convenience.
export const baseErrorCodes: BaseErrorCode[] = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INTERNAL_SERVER_ERROR',
  'NETWORK_ERROR',
  'UNKNOWN_ERROR',
]

/**
 * @typedef PlatformError
 * @description Represents an error that occurred on the platform.
 * @template C - The type of the error code.
 * @type {object}
 * @property {string} type - The type of the error.
 * @property {string} message - The message of the error.
 * @property {C} code - The code of the error.
 */
export type PlatformError<C = BaseErrorCode> = {
  type: 'PlatformError'
  message: string
  code: C
  status: number
  timestamp: string
}
