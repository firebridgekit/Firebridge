import { renderHook, act } from '@testing-library/react'
import { useCollection } from '../useCollection'

const mockQuerySnapshot = {
  docs: [
    { id: 'doc1', data: () => ({ name: 'Document 1', value: 1 }) },
    { id: 'doc2', data: () => ({ name: 'Document 2', value: 2 }) },
  ],
}

const mockCollectionRef = {
  onSnapshot: jest.fn(),
}

jest.mock('../../context', () => ({
  useFirebridge: jest.fn(),
}))

describe('useCollection', () => {
  let mockUser: any
  let mockLog: {
    error: jest.Mock
    warn: jest.Mock
    debug: jest.Mock
    print: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUser = { uid: 'test-uid' }
    mockLog = {
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      print: jest.fn(),
    }

    const { useFirebridge } = require('../../context')
    useFirebridge.mockReturnValue({ user: mockUser, log: mockLog })
  })

  it('should return undefined when user is not authenticated', () => {
    const { useFirebridge } = require('../../context')
    useFirebridge.mockReturnValue({ user: null, log: mockLog })

    const { result } = renderHook(() => 
      useCollection(mockCollectionRef)
    )

    expect(result.current).toBeUndefined()
  })

  it('should return undefined when pathParts contains undefined values', () => {
    const { result } = renderHook(() => 
      useCollection(mockCollectionRef, ['part1', undefined, 'part3'])
    )

    expect(result.current).toBeUndefined()
  })

  it('should subscribe to collection and return data', async () => {
    let onSnapshotCallback: any

    mockCollectionRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn() // unsubscribe function
    })

    const { result } = renderHook(() => 
      useCollection<{ name: string; value: number }>(mockCollectionRef)
    )

    expect(mockCollectionRef.onSnapshot).toHaveBeenCalled()

    // Simulate snapshot update
    act(() => {
      onSnapshotCallback(mockQuerySnapshot)
    })

    expect(result.current).toEqual([
      { id: 'doc1', name: 'Document 1', value: 1 },
      { id: 'doc2', name: 'Document 2', value: 2 },
    ])
  })

  it('should handle collection ref as a function', async () => {
    const mockRefFunction = jest.fn().mockReturnValue(mockCollectionRef)
    let onSnapshotCallback: any

    mockCollectionRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useCollection<{ name: string }>(mockRefFunction, ['path1', 'path2'])
    )

    expect(mockRefFunction).toHaveBeenCalledWith('test-uid', 'path1', 'path2')

    act(() => {
      onSnapshotCallback(mockQuerySnapshot)
    })

    expect(result.current).toEqual([
      { id: 'doc1', name: 'Document 1', value: 1 },
      { id: 'doc2', name: 'Document 2', value: 2 },
    ])
  })

  it('should handle errors from Firestore', () => {
    let onErrorCallback: any

    mockCollectionRef.onSnapshot.mockImplementation((onNext, onError) => {
      onErrorCallback = onError
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useCollection(mockCollectionRef)
    )

    const mockError = new Error('Firestore error')
    
    act(() => {
      onErrorCallback(mockError)
    })

    expect(result.current).toBeUndefined()
    expect(mockLog.error).toHaveBeenCalledWith(mockError)
  })

  it('should handle null snapshot', () => {
    let onSnapshotCallback: any

    mockCollectionRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useCollection(mockCollectionRef)
    )

    act(() => {
      onSnapshotCallback(null)
    })

    expect(result.current).toBeUndefined()
  })

  it('should unsubscribe when dependencies change', () => {
    const unsubscribe = jest.fn()
    mockCollectionRef.onSnapshot.mockReturnValue(unsubscribe)

    const { rerender } = renderHook(
      ({ pathParts }) => useCollection(mockCollectionRef, pathParts),
      { initialProps: { pathParts: ['path1'] } }
    )

    rerender({ pathParts: ['path2'] })

    expect(unsubscribe).toHaveBeenCalled()
  })
})