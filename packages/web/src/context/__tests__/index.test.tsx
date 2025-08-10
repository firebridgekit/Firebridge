import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { FirebaseApp } from 'firebase/app'
import { Auth, User, onAuthStateChanged, signInAnonymously, setPersistence, Persistence } from 'firebase/auth'
import { FirebridgeProvider, useFirebridge } from '../index'

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInAnonymously: jest.fn(),
  setPersistence: jest.fn(),
}))

describe('FirebridgeProvider', () => {
  let mockAuth: jest.Mocked<Auth>
  let mockApp: jest.Mocked<FirebaseApp>
  let mockUser: User
  let mockUnsubscribe: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockApp = {} as jest.Mocked<FirebaseApp>
    mockUser = { uid: 'test-uid' } as User
    mockUnsubscribe = jest.fn()
    
    mockAuth = {
      app: mockApp,
      signOut: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Auth>

    ;(onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser)
      return mockUnsubscribe
    })
  })

  it('should provide auth context to children', () => {
    const TestComponent = () => {
      const { app, user } = useFirebridge()
      return (
        <div>
          <span data-testid="user">{user?.uid}</span>
          <span data-testid="app">{app ? 'app-exists' : 'no-app'}</span>
        </div>
      )
    }

    render(
      <FirebridgeProvider auth={mockAuth}>
        <TestComponent />
      </FirebridgeProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('test-uid')
    expect(screen.getByTestId('app')).toHaveTextContent('app-exists')
  })

  it('should handle auth state changes', async () => {
    let authCallback: (user: User | null) => void = () => {}
    ;(onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      authCallback = callback
      return mockUnsubscribe
    })

    const TestComponent = () => {
      const { user } = useFirebridge()
      return <span data-testid="user">{user ? user.uid : 'no-user'}</span>
    }

    render(
      <FirebridgeProvider auth={mockAuth}>
        <TestComponent />
      </FirebridgeProvider>
    )

    act(() => {
      authCallback(null)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    act(() => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test-uid')
    })
  })

  it('should sign in anonymously when allowAnonymousSignIn is true and user is null', async () => {
    ;(onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null)
      return mockUnsubscribe
    })

    render(
      <FirebridgeProvider auth={mockAuth} allowAnonymousSignIn={true}>
        <div>test</div>
      </FirebridgeProvider>
    )

    await waitFor(() => {
      expect(signInAnonymously).toHaveBeenCalledWith(mockAuth)
    })
  })

  it('should not sign in anonymously when allowAnonymousSignIn is false', async () => {
    ;(onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null)
      return mockUnsubscribe
    })

    render(
      <FirebridgeProvider auth={mockAuth} allowAnonymousSignIn={false}>
        <div>test</div>
      </FirebridgeProvider>
    )

    await waitFor(() => {
      expect(signInAnonymously).not.toHaveBeenCalled()
    })
  })

  it('should set persistence when provided', async () => {
    const mockPersistence = {} as Persistence

    render(
      <FirebridgeProvider auth={mockAuth} persistence={mockPersistence}>
        <div>test</div>
      </FirebridgeProvider>
    )

    await waitFor(() => {
      expect(setPersistence).toHaveBeenCalledWith(mockAuth, mockPersistence)
    })
  })

  it('should provide signOut function', async () => {
    const TestComponent = () => {
      const { signOut } = useFirebridge()
      return <button onClick={signOut}>Sign Out</button>
    }

    const { getByText } = render(
      <FirebridgeProvider auth={mockAuth}>
        <TestComponent />
      </FirebridgeProvider>
    )

    await act(async () => {
      getByText('Sign Out').click()
    })

    expect(mockAuth.signOut).toHaveBeenCalled()
  })

  it('should use custom logger when provided', () => {
    const customLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      print: jest.fn(),
    }

    const TestComponent = () => {
      const { log } = useFirebridge()
      React.useEffect(() => {
        log.debug('test debug')
      }, [log])
      return null
    }

    render(
      <FirebridgeProvider auth={mockAuth} log={customLogger}>
        <TestComponent />
      </FirebridgeProvider>
    )

    expect(customLogger.debug).toHaveBeenCalledWith('test debug')
  })

  it('should use default logger when not provided', () => {
    const TestComponent = () => {
      const { log } = useFirebridge()
      React.useEffect(() => {
        // Test that default logger methods exist and are functions
        expect(typeof log.debug).toBe('function')
        expect(typeof log.error).toBe('function')
        expect(typeof log.warn).toBe('function')
        expect(typeof log.print).toBe('function')
      }, [log])
      return null
    }

    render(
      <FirebridgeProvider auth={mockAuth}>
        <TestComponent />
      </FirebridgeProvider>
    )
  })

  it('should initialize auth state on mount', () => {
    render(
      <FirebridgeProvider auth={mockAuth}>
        <div>test</div>
      </FirebridgeProvider>
    )

    expect(onAuthStateChanged).toHaveBeenCalledWith(mockAuth, expect.any(Function))
    expect(mockUnsubscribe).toBeDefined()
  })
})