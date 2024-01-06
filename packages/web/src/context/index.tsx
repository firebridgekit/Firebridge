import {
  useState,
  useEffect,
  ReactNode,
  FunctionComponent,
  createContext,
  useContext,
  useRef,
  useCallback,
} from 'react'
import { FirebaseApp } from 'firebase/app'
import {
  Auth,
  onAuthStateChanged,
  User,
  signInAnonymously,
  setPersistence,
  Persistence,
} from 'firebase/auth'

// Type definition for the logger used within the Firebridge context.
type FirebridgeLogger = {
  error: (...args: any[]) => void
  warn: (...args: any[]) => void
  debug: (...args: any[]) => void
  print: (...args: any[]) => void
}

// Default logger implementation using the console.
const defaultLogger: FirebridgeLogger = {
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  print: console.log,
}

// Props for the FirebridgeProvider component.
interface FirebridgeContextProps {
  auth: Auth
  children: ReactNode
  allowAnonymousSignIn?: boolean
  log?: FirebridgeLogger
  persistence?: Persistence
}

// Value of the Firebridge context.
interface FirebridgeContextValue {
  app: FirebaseApp
  user: User | null | undefined
  signOut: () => Promise<void>
  log: FirebridgeLogger
}

// Creation of the Firebridge context with a default value.
export const FirebridgeContext = createContext<FirebridgeContextValue>({
  app: {} as FirebaseApp,
  user: undefined,
  signOut: async () => {},
  log: defaultLogger,
})

/**
 * @function FirebridgeProvider
 * FirebridgeProvider component.
 *
 * Provides Firebase authentication context and logger to its child components.
 * Manages the authentication state, including anonymous sign-in if enabled, and persistence settings.
 *
 * @param auth The Firebase Auth instance.
 * @param children Child components that will have access to the context.
 * @param allowAnonymousSignIn Whether to allow anonymous sign-in. Defaults to false.
 * @param log Custom logger to be used within the context. Defaults to console logging.
 * @param persistence The persistence behavior of the auth session.
 * @returns React component that provides the Firebridge context.
 */
export const FirebridgeProvider: FunctionComponent<FirebridgeContextProps> = ({
  auth,
  children,
  allowAnonymousSignIn,
  log = defaultLogger,
  persistence,
}) => {
  const [user, setUser] = useState<User | null>()
  const unsubscribeRef = useRef<Function>()

  useEffect(() => {
    if (allowAnonymousSignIn && user === null) signInAnonymously(auth)
  }, [user])

  const initialize = useCallback(async () => {
    if (unsubscribeRef.current) unsubscribeRef.current()
    if (persistence) await setPersistence(auth, persistence)
    unsubscribeRef.current = onAuthStateChanged(auth, setUser)
  }, [persistence])

  useEffect(() => {
    initialize()
  }, [])

  const signOut = async () => {
    setUser(null)
    await auth.signOut()
  }

  return (
    <FirebridgeContext.Provider value={{ app: auth.app, user, signOut, log }}>
      {children}
    </FirebridgeContext.Provider>
  )
}

/**
 * Custom hook to access the Firebridge context.
 *
 * @returns The Firebridge context value, including the Firebase app, user, signOut function, and log functions.
 */
export const useFirebridge = () => useContext(FirebridgeContext)
