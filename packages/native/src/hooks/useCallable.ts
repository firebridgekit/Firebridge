import { useCallback } from 'react'
import functions from '@react-native-firebase/functions'

import { useFirebridge } from '../context'

/**
 * @function useCallable
 * A custom hook to create a callable cloud function.
 *
 * This hook abstracts the process of invoking a callable cloud function using Firebase.
 * It provides an easy-to-use interface for making cloud function calls and handling responses.
 *
 * @template Body The type of the request body sent to the cloud function.
 * @template Response The expected response type from the cloud function.
 * @param name The name of the cloud function to be called.
 * @returns A function that can be used to invoke the cloud function with an optional request body.
 *          This function returns a promise that resolves to the cloud function's response.
 *
 * @example
 * const addMessage = useCallable<{ text: string }, { success: boolean }>('addMessage');
 * const response = await addMessage({ text: 'Hello, world!' });
 */
export const useCallable = <Body = undefined, Response = void>(
  name: string,
) => {
  // Retrieve the log function from the Firebridge context
  const { log } = useFirebridge()

  // Create a callable function reference using Firebase functions
  const callable = functions().httpsCallable(name)

  // Return an asynchronous function for invoking the cloud function
  return useCallback(
    async (body?: Body): Promise<Response> => {
      // Log the cloud function call with the request body, if provided
      log.debug(`[Cloud Callable]: ${name}`, { ...(body as Body) })

      // Call the cloud function with the request body and wait for the response
      const result = await callable({ ...(body as Body) })

      // Return the data from the response
      return result?.data as Response
    },
    [name, log],
  )
}
