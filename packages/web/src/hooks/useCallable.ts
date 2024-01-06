import { Functions, httpsCallable } from 'firebase/functions'

import { useFirebridge } from '../context'

/**
 * @function useCallable
 * Custom hook to invoke Firebase Cloud Functions.
 *
 * This hook creates a callable function that can be used to make requests to Firebase Cloud Functions.
 * It automatically logs the function call and handles the response.
 *
 * @template Body The type of the request body sent to the cloud function. Default is undefined.
 * @template Response The expected response type from the cloud function. Default is void.
 * @param functionsInstance The Firebase Functions instance.
 * @param name The name of the cloud function to be called.
 * @returns An asynchronous function that takes an optional request body and returns a promise with the response.
 *
 * @example
 * const myFunction = useCallable<{ input: string }, { result: string }>(functions, 'myFunction');
 * const response = await myFunction({ input: 'Hello' });
 */
export const useCallable = <Body = undefined, Response = void>(
  functionsInstance: Functions,
  name: string,
) => {
  // Retrieve the logger from the Firebridge context.
  const { log } = useFirebridge()

  // Create a callable function reference using Firebase functions.
  const callable = httpsCallable(functionsInstance, name)

  // Return an asynchronous function for invoking the cloud function.
  return async (body?: Body): Promise<Response> => {
    // Log the cloud function call with the request body, if provided.
    log.debug(`[Cloud Callable]: ${name}`, { ...(body as Body) })

    // Call the cloud function with the request body and wait for the response.
    const result = await callable({ ...(body as Body) })

    // Return the data from the response, cast to the expected type.
    return result?.data as Response
  }
}
