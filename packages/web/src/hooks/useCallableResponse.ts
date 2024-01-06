import { Functions, httpsCallable } from 'firebase/functions'
import { useEffect, useState } from 'react'

/**
 * @function useCallableResponse
 * Custom hook to fetch and store the response from a Firebase Cloud Function.
 *
 * This hook automatically calls a specified Firebase Cloud Function when the component mounts
 * and stores the response in its state. It's useful for fetching data on component initialization.
 *
 * @template Response The expected type of the response from the cloud function.
 * @param functionsInstance The Firebase Functions instance.
 * @param name The name of the cloud function to be called.
 * @param args The arguments to be passed to the cloud function.
 * @returns The response from the cloud function, stored in the component's state.
 *
 * @example
 * const userSettings = useCallableResponse<UserSettings>(functions, 'getUserSettings', { userId: '123' });
 */
export const useCallableResponse = <Response>(
  functionsInstance: Functions,
  name: string,
  args: any,
) => {
  // State to store the response from the cloud function.
  const [response, setResponse] = useState<Response>()

  // Function to call the cloud function and update the state with its response.
  const onCall = async () => {
    const callable = httpsCallable(functionsInstance, name)
    const result = await callable(args)
    setResponse(result?.data as Response)
  }

  // Automatically call the cloud function when the component mounts.
  useEffect(() => {
    onCall()
  }, [])

  // Return the response from the state.
  return response
}
