import React from 'react'
import { render, act } from '@testing-library/react'
import auth from '@react-native-firebase/auth'
import { FirebridgeProvider, useFirebridge } from '../index'

jest.mock('@react-native-firebase/auth')

describe('FirebridgeProvider', () => {
  let mockAuth: any
  let mockUser: any
  let mockUnsubscribe: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUser = { uid: 'test-uid', getIdToken: jest.fn().mockResolvedValue('token') }
    mockUnsubscribe = jest.fn()
    
    mockAuth = {
      currentUser: mockUser,
      onAuthStateChanged: jest.fn(),
      signInAnonymously: jest.fn().mockResolvedValue({ user: mockUser }),
      signOut: jest.fn().mockResolvedValue(undefined),
    }

    ;(auth as jest.Mock).mockReturnValue(mockAuth)
  })

  it('should provide auth context to children', async () => {
    let capturedContext: any
    let authCallback: any

    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      authCallback = callback
      return mockUnsubscribe
    })

    const TestComponent = () => {
      capturedContext = useFirebridge()
      return <div>test</div>
    }

    await act(async () => {
      render(
        <FirebridgeProvider>
          <TestComponent />
        </FirebridgeProvider>
      )
    })

    // Simulate the auth callback being called
    await act(async () => {
      authCallback(mockUser)
    })

    expect(capturedContext.user?.uid).toBe('test-uid')
    expect(typeof capturedContext.signOut).toBe('function')
    expect(typeof capturedContext.clearUser).toBe('function')
    expect(typeof capturedContext.log.debug).toBe('function')
    expect(mockAuth.onAuthStateChanged).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should handle anonymous sign in', async () => {
    let authCallback: any

    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      authCallback = callback
      return mockUnsubscribe
    })

    await act(async () => {
      render(
        <FirebridgeProvider allowAnonymousSignIn={true}>
          <div>test</div>
        </FirebridgeProvider>
      )
    })

    // Simulate auth callback with null user
    await act(async () => {
      authCallback(null)
    })

    expect(mockAuth.signInAnonymously).toHaveBeenCalled()
  })

  it('should not sign in anonymously when flag is false', async () => {
    let authCallback: any

    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      authCallback = callback
      return mockUnsubscribe
    })

    await act(async () => {
      render(
        <FirebridgeProvider allowAnonymousSignIn={false}>
          <div>test</div>
        </FirebridgeProvider>
      )
    })

    // Simulate auth callback with null user
    await act(async () => {
      authCallback(null)
    })

    expect(mockAuth.signInAnonymously).not.toHaveBeenCalled()
  })

  it('should use custom logger', async () => {
    const customLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      print: jest.fn(),
    }

    let capturedContext: any
    let authCallback: any

    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      authCallback = callback
      return mockUnsubscribe
    })

    const TestComponent = () => {
      capturedContext = useFirebridge()
      return <div>test</div>
    }

    await act(async () => {
      render(
        <FirebridgeProvider log={customLogger}>
          <TestComponent />
        </FirebridgeProvider>
      )
    })

    expect(capturedContext.log).toBe(customLogger)
  })

  it('should initialize auth state on mount', async () => {
    await act(async () => {
      render(
        <FirebridgeProvider>
          <div>test</div>
        </FirebridgeProvider>
      )
    })

    expect(mockAuth.onAuthStateChanged).toHaveBeenCalledWith(expect.any(Function))
  })
})