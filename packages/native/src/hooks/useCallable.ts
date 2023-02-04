import functions from '@react-native-firebase/functions'
import { useFirebridge } from '../contexts'

export const makeCallable = <T, B = any>(name: string) => {
  const { log } = useFirebridge()
  const callable = functions().httpsCallable(name)
  return async (body?: B): Promise<T> => {
    log.debug(`[Cloud Callable]: ${name}`, { ...(body as B) })
    const result = await callable({ ...(body as B) })
    return result?.data
  }
}
