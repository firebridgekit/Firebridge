import { https, RuntimeOptions } from 'firebase-functions'
import { z } from 'zod'
import * as express from 'express'

/**
 * @function getRunOptions
 * @description A function to get the runtime options for a Firebase function.
 * @param {InvokableRuntimeModes} [modes={}] - An object representing the runtime modes. Each key is a mode name and the value is a RuntimeOptions object for that mode. Defaults to an empty object if not provided.
 * @returns {RuntimeOptions} - The runtime options for the Firebase function. If a mode is specified in the Firebase config, the function will return the options for that mode. If no mode is specified, the function will return the default options. If a mode is specified but no options are provided for that mode, the function will return the default options.
 */
export type AuthenticatedContext = {
  auth: { uid: string }
  // These are custom claims you can add to an API key.
  // They are never used in a callable
  claims?: any
}

/**
 * @typedef InvokableActionV1
 * @description Represents an action that can be invoked with a body and context.
 * @template Body - The type of the body to pass to the action.
 * @template Response - The type of the response from the action.
 * @param {Body} body - The body to pass to the action.
 * @param {AuthenticatedContext} context - The context to pass to the action.
 * @returns {Response | Promise<Response>} - The response from the action, or a Promise that resolves with the response.
 */
export type InvokableActionV1<Body, Response> = (
  body: Body,
  context: AuthenticatedContext,
) => Response | Promise<Response>

/**
 * @typedef BodyValidationSchema
 * @description Represents a validation schema for a request body.
 */
export type BodyValidationSchema = z.ZodObject<any>

/**
 * @typedef InvokableRuntimeModes
 * @description Represents the runtime modes for a Firebase function.
 * @property {RuntimeOptions} [performance] - The runtime options for the 'performance' mode.
 * @property {RuntimeOptions} [default] - The runtime options that are applied for all modes.
 */
export type InvokableRuntimeModes = {
  performance?: RuntimeOptions
  // these are applied for all modes
  default?: RuntimeOptions
}

/**
 * @typedef OnCallHandler
 * @description Represents a handler for a callable Firebase function.
 * @param {Body} data - The data passed to the function.
 * @param {https.CallableContext} callable - The context of the callable function.
 * @returns {Response} - The response from the function.
 */
export type OnCallHandler<Body = any, Response = void> = (
  data: Body,
  callable: https.CallableContext,
) => Response

/**
 * @typedef OnRequestHandlerV1
 * @description Represents a handler for a request to a Firebase function.
 * @param {https.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @returns {Promise<Response>} - A Promise that resolves with the response from the function.
 */
export type OnRequestHandlerV1<Response = void> = (
  req: https.Request,
  res: express.Response,
) => Promise<Response>
