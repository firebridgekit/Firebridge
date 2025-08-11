import { https } from 'firebase-functions'

import { AuthenticatedContext, InvokableActionV1 } from '../type'

/**
 * @function invoke
 * @description A function to invoke an action with a body and context.
 * @template Body - The type of the body to pass to the action.
 * @template Response - The type of the response from the action. Defaults to void if not provided.
 * @param {InvokableActionV1<Body, Response>} action - The action to invoke.
 * @param {Body} body - The body to pass to the action.
 * @param {AuthenticatedContext} context - The context to pass to the action.
 * @returns {Promise<Response>} - A Promise that resolves with the response from the action.
 * @throws {https.HttpsError} - Throws an error if the action throws an error. The error message will be the action error message, or an empty string if no message is available.
 */
const invoke = async <Body, Response = void>(
  action: InvokableActionV1<Body, Response>,
  body: Body,
  context: AuthenticatedContext,
) => {
  try {
    const response = await action(body, context)
    return response
  } catch (error) {
    throw new https.HttpsError('unknown', (error as any)?.message || '')
  }
}

export default invoke
