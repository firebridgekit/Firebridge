import {
  createContext,
  FunctionComponent,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'

type FirebridgeContextUser = FirebaseAuthTypes.User | null | undefined

type FirebridgeLogger = {
  error: (...args: any[]) => void
  warn: (...args: any[]) => void
  debug: (...args: any[]) => void
  print: (...args: any[]) => void
}

const defaultLogger: FirebridgeLogger = {
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  print: console.log,
}

type FirebridgeContextValue = {
  user: FirebridgeContextUser
  signOut: () => Promise<void>
  clearUser: () => void
  log: FirebridgeLogger
}
const defaultValue = {
  user: undefined,
  signOut: async () => {},
  clearUser: () => {},
  log: defaultLogger,
} as FirebridgeContextValue

export const FirebridgeContext = createContext(defaultValue)

interface FirebridgeProviderProps {
  allowAnonymousSignIn?: boolean
  children?: ReactNode
  log?: FirebridgeLogger
}

export const FirebridgeProvider: FunctionComponent<FirebridgeProviderProps> = ({
  allowAnonymousSignIn,
  children,
  log = defaultLogger,
}) => {
  const [user, setUser] = useState<FirebridgeContextUser>()

  const initialize = async () => {
    try {
      // ensures the user account still exists. auto signs out if it doesn't.
      await auth().currentUser?.getIdToken(true)
    } catch (e) {
      console.log(e)
    }

    auth().onAuthStateChanged((nextUser: FirebaseAuthTypes.User | null) => {
      if (nextUser === null && allowAnonymousSignIn) {
        auth().signInAnonymously()
      } else {
        setUser(nextUser)
      }
    })
  }

  useEffect(() => {
    initialize()
  }, [])

  const clearUser = () => setUser(undefined)

  const signOut = async () => {
    clearUser()
    return auth().signOut()
  }

  return (
    <FirebridgeContext.Provider value={{ user, signOut, clearUser, log }}>
      {children}
    </FirebridgeContext.Provider>
  )
}

export const useFirebridge = () => useContext(FirebridgeContext)
