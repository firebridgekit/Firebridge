import { Response } from 'express'
import { z } from 'zod'
import { Request } from 'firebase-functions/v2/https'

export type AuthenticatedBody<Body, T = {}> = T & {
  data: Body
  auth: { uid: string }
  // These are custom claims you can add to an API key.
  // They are never used in a callable
  claims?: any
}

/**
 * @typedef InvokableAction
 * @description Represents an action that can be invoked with a body and context.
 * @template Body - The type of the body to pass to the action.
 * @template Response - The type of the response from the action.
 * @param {Body} body - The body to pass to the action.
 * @param {AuthenticatedContext} context - The context to pass to the action.
 * @returns {Response | Promise<Response>} - The response from the action, or a Promise that resolves with the response.
 */
export type InvokableAction<Body, Response> = (
  body: AuthenticatedBody<Body>,
) => Response | Promise<Response>

/**
 * @typedef BodyValidationSchema
 * @description Represents a validation schema for a request body.
 */
export type BodyValidationSchema = z.ZodObject<any>

/**
 * @typedef OnRequestHandler
 * @description Represents a handler for a request to a Firebase function.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @returns {Promise<Res>} - A Promise that resolves with the response from the function.
 */
export type OnRequestHandler<Res = void> = (
  req: Request,
  res: Response,
) => Promise<Res>
