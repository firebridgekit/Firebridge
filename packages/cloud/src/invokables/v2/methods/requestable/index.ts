import {
  onRequest,
  HttpsOptions,
  HttpsError,
  Request,
} from 'firebase-functions/v2/https'
import { Response } from 'express'

import { BodyValidationSchema, InvokableAction } from '../../type'
import { getKey } from '../../../../permissions'

import validate from '../../utils/validate'
import invoke from '../../utils/invoke'

/**
 * @function requestable
 * @description A function that returns a Firebase HTTPS trigger function. This function performs several tasks, including looking up the x-api-key header in the "keys" collection, strongly typing context.auth.uid as string, performing validation on the body, and performing any necessary logging.
 * @template Body - The type of the body to pass to the action.
 * @template Response - The type of the response from the action. Defaults to void if not provided.
 * @param {Object} options - The options for the function.
 * @param {InvokableAction<Body, Response>} options.action - The action to invoke.
 * @param {BodyValidationSchema} [options.validation] - The validation schema to use. If not provided, the function will not perform any validation.
 * @param {(args: Body) => string[]} [options.scope] - A function that takes the body as an argument and returns an array of permission scopes. If not provided, no permission check is performed.
 * @returns {OnRequestHandler} - A function that can be provided to https.onRequest. This function takes a request and response object and returns a Promise that resolves with the response from the action.
 */
export const requestableV2 = <Body, Res = void>(options: {
  action: InvokableAction<Body, Res>
  options?: HttpsOptions
  validation?: BodyValidationSchema
  scope?: (args: Body) => string[]
}) =>
  onRequest(options.options ?? {}, async (req: Request, res: Response) => {
    // Checking for the presence of an 'x-api-key' in the request header.
    const keyHash = req.header('x-api-key')
    if (!keyHash) {
      throw new HttpsError(
        'unauthenticated',
        'You must provide an x-api-key header.',
      )
    }

    // Verifying the provided API key against the 'keys' collection in Firestore.
    const key = await getKey(keyHash)
    if (!key?.uid) {
      throw new HttpsError('unauthenticated', 'API key not found.')
    }

    // Validating the request body against the provided schema, if any.
    await validate(req.body, options.validation)

    // Invoking the specified action with the request body and a custom context.
    const response = invoke(options.action, {
      data: req.body.data,
      auth: { uid: key.uid },
      claims: key.claims,
    })

    // Sending the response back to the client.
    res.send(response)
    res.end()
  })
