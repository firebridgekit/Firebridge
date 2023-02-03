import { Functions, httpsCallable } from 'firebase/functions'
import { useEffect, useState } from 'react'

export const useCallableResponse = <Response>(
  functionsInstance: Functions,
  name: string,
  args: any,
) => {
  const [response, setResponse] = useState<Response>()

  const onCall = async () => {
    const callable = httpsCallable(functionsInstance, name)
    const result = await callable(args)
    setResponse(result?.data as Response)
  }

  useEffect(() => {
    onCall()
  }, [])

  return response
}
