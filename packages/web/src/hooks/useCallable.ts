import { Functions, httpsCallable } from 'firebase/functions'
import { useFirebridge } from '../contexts'

export const useCallable = <B = undefined, T = void>(
  functionsInstance: Functions,
  name: string,
) => {
  const { log } = useFirebridge()
  const callable = httpsCallable(functionsInstance, name)
  return async (body?: B): Promise<T> => {
    log.debug(`[Cloud Callable]: ${name}`, { ...(body as B) })
    const result = await callable({ ...(body as B) })
    return result?.data as T
  }
}
