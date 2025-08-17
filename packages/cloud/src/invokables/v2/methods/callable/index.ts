import {
  onCall,
  CallableOptions,
  HttpsError,
  CallableRequest,
} from 'firebase-functions/v2/https'

import {
  InvokableAction,
  BodyValidationSchema,
  AuthenticatedBody,
} from '../../type'
import { UserPermissions } from '../../../../types'
import { getUserPermissions, userHasPermission } from '../../../../permissions'

import invoke from '../../utils/invoke'
import validate from '../../utils/validate'

/**
 * @function callable
 * @description A function that returns a Firebase callable function. This function performs several tasks, including ensuring that the user is authenticated, strongly typing context.auth.uid as string, performing validation on the body, and performing any necessary logging.
 * @template Body - The type of the body to pass to the action.
 * @template Response - The type of the response from the action. Defaults to void if not provided.
 * @param {Object} options - The options for the function.
 * @param {InvokableAction<AuthenticatedBody<Body>, Response>} options.action - The action to invoke.
 * @param {CallableOptions} [options.options] - The options to use for the callable function. If not provided, the default options are used.
 * @param {BodyValidationSchema} [options.validation] - The validation schema to use. If not provided, the function will not perform any validation.
 * @param {string | ((args: Body) => string[])} [options.scope] - The scope of permissions required to invoke the action. If a string is provided, it is used as the permission scope. If a function is provided, it is called with the body as an argument and should return an array of permission scopes. If not provided, no permission check is performed.
 * @param {<T extends UserPermissions>(permissions: T, data: Body) => boolean} [options.checkHasPermission] - A custom function to check if the user has the required permissions. The function is called with the user's permissions and the body as arguments and should return a boolean indicating whether the user has the required permissions. If not provided, the default permission check is used.
 * @returns {OnCallHandler} - A function that can be provided to https.onCall. This function takes a data object and a context object and returns a Promise that resolves with the response from the action.
 */
export const callableV2 = <Body, Response = void>(options: {
  action: InvokableAction<Body, Response>
  options?: CallableOptions
  validation?: BodyValidationSchema
  scope?: string | ((args: Body) => string[])
  checkHasPermission?: <T extends UserPermissions>(
    permissions: T,
    data: Body,
  ) => boolean
}) =>
  onCall<Body, Promise<Response>>(options.options ?? {}, async body => {
    // Check if the user is authenticated
    if (!body?.auth?.uid) {
      throw new HttpsError('unauthenticated', 'user is not authenticated')
    }

    await validate(body.data, options.validation)

    // Perform permission checks if a scope is defined
    if (options?.scope) {
      const scope =
        typeof options?.scope === 'string'
          ? [options?.scope]
          : options?.scope(body.data)

      // Check if the user has the required permissions
      const permission = await userHasPermission(body.auth.uid, ...scope)
      if (!permission) {
        throw new HttpsError(
          'permission-denied',
          'user does not have the required permissions',
        )
      }
    }

    // Use a custom permission check function if provided
    if (options?.checkHasPermission) {
      const userPermissions = await getUserPermissions(body.auth.uid)
      const hasPermission =
        userPermissions &&
        options?.checkHasPermission(userPermissions, body.data)
      if (!hasPermission) {
        throw new HttpsError(
          'permission-denied',
          'user does not have the required permissions',
        )
      }
    }

    // Invoke the specified action with the request body and context
    const response = await invoke(
      options.action,
      body as AuthenticatedBody<Body, CallableRequest>,
    )

    return response
  })
