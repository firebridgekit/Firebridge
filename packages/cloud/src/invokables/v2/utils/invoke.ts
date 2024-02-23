import { HttpsError } from 'firebase-functions/v2/https'

import { AuthenticatedBody, InvokableAction } from '../type'

/**
 * @function invoke
 * @description A function to invoke an action with a body and context.
 * @template Body - The type of the body to pass to the action.
 * @template Response - The type of the response from the action. Defaults to void if not provided.
 * @param {InvokableAction<Body, Response>} action - The action to invoke.
 * @param {Body} body - The body to pass to the action.
 * @param {AuthenticatedContext} context - The context to pass to the action.
 * @returns {Promise<Response>} - A Promise that resolves with the response from the action.
 * @throws {HttpsError} - Throws an error if the action throws an error. The error message will be the action error message, or an empty string if no message is available.
 */
const invoke = async <Body, Response = void>(
  action: InvokableAction<Body, Response>,
  body: AuthenticatedBody<Body>,
) => {
  try {
    const response = await action(body)
    return response
  } catch (error) {
    throw new HttpsError('unknown', (error as any)?.message || '')
  }
}

export default invoke
