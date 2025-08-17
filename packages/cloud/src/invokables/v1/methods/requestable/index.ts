import { https, runWith } from 'firebase-functions'
import * as express from 'express'

import {
  BodyValidationSchema,
  InvokableActionV1,
  InvokableRuntimeModes,
  OnRequestHandlerV1,
} from '../../types'
import { getKey } from '../../../../permissions'

import validate from '../../utils/validate'
import invoke from '../../utils/invoke'
import getRunOptions from '../../utils/getRunOptions'

/**
 * @function requestable
 * @description A function that returns a Firebase HTTPS trigger function. This function performs several tasks, including looking up the x-api-key header in the "keys" collection, strongly typing context.auth.uid as string, performing validation on the body, and performing any necessary logging.
 * @template Body - The type of the body to pass to the action.
 * @template Response - The type of the response from the action. Defaults to void if not provided.
 * @param {Object} options - The options for the function.
 * @param {InvokableActionV1<Body, Response>} options.action - The action to invoke.
 * @param {BodyValidationSchema} [options.validation] - The validation schema to use. If not provided, the function will not perform any validation.
 * @param {(args: Body) => string[]} [options.scope] - A function that takes the body as an argument and returns an array of permission scopes. If not provided, no permission check is performed.
 * @returns {OnRequestHandlerV1} - A function that can be provided to https.onRequest. This function takes a request and response object and returns a Promise that resolves with the response from the action.
 */
export const requestable =
  <Body, Response = void>(options: {
    action: InvokableActionV1<Body, Response>
    validation?: BodyValidationSchema
    scope?: (args: Body) => string[]
  }): OnRequestHandlerV1 =>
  async (req: https.Request, res: express.Response) => {
    // Checking for the presence of an 'x-api-key' in the request header.
    const keyHash = req.header('x-api-key')
    if (!keyHash) {
      throw new https.HttpsError(
        'unauthenticated',
        'You must provide an x-api-key header.',
      )
    }

    // Verifying the provided API key against the 'keys' collection in Firestore.
    const key = await getKey(keyHash)
    if (!key?.uid) {
      throw new https.HttpsError('unauthenticated', 'API key not found.')
    }

    // Validating the request body against the provided schema, if any.
    await validate(req.body, options.validation)

    // Invoking the specified action with the request body and a custom context.
    const response = invoke(options.action, req.body, {
      auth: { uid: key.uid },
      claims: key.claims,
    })

    // Sending the response back to the client.
    res.send(response)
    res.end()
  }

// Helper function to create a Firebase HTTPS trigger with runtime options.
export const onRequest = (
  onRequestHandler: OnRequestHandlerV1,
  modes: InvokableRuntimeModes,
) => runWith(getRunOptions(modes)).https.onRequest(onRequestHandler)
