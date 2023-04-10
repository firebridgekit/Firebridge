import {
  useState,
  useEffect,
  ReactNode,
  FunctionComponent,
  createContext,
  useContext,
} from 'react'
import { FirebaseApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions'

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
  app: FirebaseApp
  children: ReactNode
  log: FirebridgeLogger
  functionsEmulator?: boolean | number
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
  app,
  children,
  log = defaultLogger,
  functionsEmulator,
}) => {
  const [user, setUser] = useState<User | null>()
  useEffect(() => onAuthStateChanged(getAuth(app), setUser), [])

  useEffect(() => {
    if (app && functionsEmulator) {
      const port =
        typeof functionsEmulator === 'number' ? functionsEmulator : 5001
      connectFunctionsEmulator(getFunctions(app), 'localhost', port)
    }
  }, [app, functionsEmulator])

  const signOut = async () => {
    setUser(null)
    await getAuth(app).signOut()
  }

  return (
    <FirebridgeContext.Provider value={{ user, signOut, log }}>
      {children}
    </FirebridgeContext.Provider>
  )
}

export const useFirebridge = () => useContext(FirebridgeContext)
