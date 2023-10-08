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

interface FirebridgeContextProps {
  auth: Auth
  children: ReactNode
  allowAnonymousSignIn?: boolean
  log?: FirebridgeLogger
  persistence?: Persistence
}

interface FirebridgeContextValue {
  app: FirebaseApp | null | undefined
  user: User | null | undefined
  signOut: () => Promise<void>
  log: FirebridgeLogger
}

export const FirebridgeContext = createContext<FirebridgeContextValue>({
  app: undefined,
  user: undefined,
  signOut: async () => {},
  log: defaultLogger,
})

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

export const useFirebridge = () => useContext(FirebridgeContext)
