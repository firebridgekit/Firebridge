import { Functions, httpsCallable } from 'firebase/functions'

export const useCallable = <B = undefined, T = void>(
  functionsInstance: Functions,
  name: string,
) => {
  const callable = httpsCallable(functionsInstance, name)
  return async (body?: B): Promise<T> => {
    try {
      const result = await callable({ ...(body as B) })
      return result?.data as T
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
