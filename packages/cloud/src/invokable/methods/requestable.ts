import { https, runWith } from 'firebase-functions'
import * as express from 'express'

import { getKey } from '../../keys'
import {
  BodyValidationSchema,
  InvokableAction,
  InvokableRuntimeModes,
  OnRequestHandler,
} from '../type'
import { validate } from '../utils/validate'
import { invoke } from '../utils/invoke'
import { getRunOptions } from '../utils/getRunOptions'

// REQUESTABLE
// -----------

// Invokable Wrapper for Firebase HTTPS Triggers
// Read more about HTTPS Triggers: https://bit.ly/2P23h4M

// Returns a function that can be provided to https.onRequest
// For example: https.onRequest(requestable(() => "Hello World"))
// Of course, this is just a simple example, this util also:
//   * Looks up the x-api-key header in the "keys" collection.
//   * Strongly types context.auth.uid as string.
//   * Performs validation on the body.
//   * Performs any necessary logging.

export const requestable =
  <Body, Response = void>(options: {
    action: InvokableAction<Body, Response>
    validation?: BodyValidationSchema
    scope?: (args: Body) => string[]
  }): OnRequestHandler =>
  async (req: https.Request, res: express.Response) => {
    // Ensure that an x-api-key header was provided.
    const keyHash = req.header('x-api-key')
    if (!keyHash) {
      throw new https.HttpsError(
        'unauthenticated',
        'You must provide an x-api-key header.',
      )
    }

    // Ensure that the provided key can be found.
    const key = await getKey(keyHash)
    if (!key?.uid) {
      throw new https.HttpsError('unauthenticated', 'API key not found.')
    }

    await validate(req.body, options.validation)
    const response = invoke(options.action, req.body, {
      auth: { uid: key.uid },
      claims: key.claims,
    })

    res.send(response)
    res.end()
  }

export const onRequest = (
  onRequestHandler: OnRequestHandler,
  modes: InvokableRuntimeModes,
) => runWith(getRunOptions(modes)).https.onRequest(onRequestHandler)
