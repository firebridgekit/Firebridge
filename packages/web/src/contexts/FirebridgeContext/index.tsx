import {
  useState,
  useEffect,
  ReactNode,
  FunctionComponent,
  createContext,
  useContext,
} from 'react'
import {
  Auth,
  onAuthStateChanged,
  User,
  signInAnonymously,
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
}

interface FirebridgeContextValue {
  user: User | null | undefined
  signOut: () => Promise<void>
  log: FirebridgeLogger
}

export const FirebridgeContext = createContext<FirebridgeContextValue>({
  user: undefined,
  signOut: async () => {},
  log: defaultLogger,
})

export const FirebridgeProvider: FunctionComponent<FirebridgeContextProps> = ({
  auth,
  children,
  allowAnonymousSignIn,
  log = defaultLogger,
}) => {
  const [user, setUser] = useState<User | null>()

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser: User | null) => {
        if (nextUser === null && allowAnonymousSignIn) signInAnonymously(auth)
        else setUser(nextUser)
      }),
    [],
  )

  const signOut = async () => {
    setUser(null)
    await auth.signOut()
  }

  return (
    <FirebridgeContext.Provider value={{ user, signOut, log }}>
      {children}
    </FirebridgeContext.Provider>
  )
}

export const useFirebridge = () => useContext(FirebridgeContext)
