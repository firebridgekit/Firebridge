import { https, runWith } from 'firebase-functions'

import {
  AuthenticatedContext,
  InvokableAction,
  BodyValidationSchema,
  InvokableRuntimeModes,
  OnCallHandler,
} from '../type'
import { getRunOptions } from '../utils/getRunOptions'
import { invoke } from '../utils/invoke'
import { validate } from '../utils/validate'
import {
  UserPermissions,
  getUserPermissions,
  userHasPermission,
} from '../../permissions'

// CALLABLE
// --------

// Invokable Wrapper for Firebase Cloud Callables
// Read more about Cloud Callables: https://bit.ly/3mHmRRI

// Returns a function that can be provided to https.onCall
// For example: https.onCall(callable(() => "Hello World"))
// Of course, this is just a simple example, this util also:
//   * Ensures that the user is authenticated.
//   * Strongly types context.auth.uid as string.
//   * Performs validation on the body.
//   * Performs any necessary logging.

export const callable =
  <Body, Response = void>(options: {
    action: InvokableAction<Body, Response>
    validation?: BodyValidationSchema
    scope?: string | ((args: Body) => string[])
    checkHasPermission?: <T extends UserPermissions>(permissions: T) => boolean
  }): OnCallHandler =>
  async (body: Body, context: AuthenticatedContext & any) => {
    if (!context.auth) {
      throw new https.HttpsError('unauthenticated', 'user is not authenticated')
    }

    await validate(body, options?.validation)

    if (options?.scope) {
      const scope =
        typeof options?.scope === 'string'
          ? [options?.scope]
          : options?.scope(body)

      const permission = await userHasPermission(context.auth.uid, ...scope)
      if (!permission) {
        throw new https.HttpsError(
          'permission-denied',
          'user does not have the required permissions',
        )
      }
    }

    if (options?.checkHasPermission) {
      const userPermissions = await getUserPermissions(context.auth.uid)
      const hasPermission =
        userPermissions && options?.checkHasPermission(userPermissions)
      if (!hasPermission) {
        throw new https.HttpsError(
          'permission-denied',
          'user does not have the required permissions',
        )
      }
    }

    const response = await invoke(options.action, body, context)
    return response
  }

export const onCall = (
  onCallHandler: OnCallHandler,
  modes?: InvokableRuntimeModes,
) => runWith(getRunOptions(modes)).https.onCall(onCallHandler)
