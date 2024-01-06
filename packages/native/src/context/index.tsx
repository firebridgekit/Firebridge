import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
import {
  createContext,
  FunctionComponent,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

// Type definition for the user object within the Firebridge context.
type FirebridgeContextUser = FirebaseAuthTypes.User | null | undefined

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

// Type definition for the value of the Firebridge context.
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

// Creation of the Firebridge context with the default value.
export const FirebridgeContext = createContext(defaultValue)

/**
 * @type FirebridgeProviderProps
 * Props for the FirebridgeProvider component.
 */
type FirebridgeProviderProps = {
  allowAnonymousSignIn?: boolean
  children?: ReactNode
  log?: FirebridgeLogger
}

/**
 * @function FirebridgeProvider
 * FirebridgeProvider component.
 *
 * Provides Firebase authentication context and logger to its child components.
 * Manages the authentication state and allows for anonymous sign-in if enabled.
 *
 * @param allowAnonymousSignIn Whether to allow anonymous sign-in. Defaults to false.
 * @param children Child components that will have access to the context.
 * @param log Custom logger to be used within the context. Defaults to console logging.
 * @returns React component that provides the Firebridge context.
 */
export const FirebridgeProvider: FunctionComponent<FirebridgeProviderProps> = ({
  allowAnonymousSignIn,
  children,
  log = defaultLogger,
}) => {
  const [user, setUser] = useState<FirebridgeContextUser>()

  // Initializes the Firebase authentication listener.
  const initialize = async () => {
    try {
      // Ensures the user account still exists; auto signs out if it doesn't.
      await auth().currentUser?.getIdToken(true)
    } catch (e) {
      console.log(e)
    }

    // Listener for authentication state changes.
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

  // Clears the current user from state.
  const clearUser = () => setUser(undefined)

  // Signs out the current user.
  const signOut = async () => {
    clearUser()
    return auth().signOut()
  }

  // Provides the context value to child components.
  return (
    <FirebridgeContext.Provider value={{ user, signOut, clearUser, log }}>
      {children}
    </FirebridgeContext.Provider>
  )
}

/**
 * @function useFirebridge
 * Custom hook to access the Firebridge context.
 *
 * @returns The Firebridge context value, including user, signOut, clearUser, and log functions.
 */
export const useFirebridge = () => useContext(FirebridgeContext)
