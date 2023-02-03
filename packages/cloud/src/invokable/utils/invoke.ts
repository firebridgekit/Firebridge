import { https } from 'firebase-functions'

import { AuthenticatedContext, InvokableAction } from '../type'

export const invoke = async <Body, Response = void>(
  action: InvokableAction<Body, Response>,
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
