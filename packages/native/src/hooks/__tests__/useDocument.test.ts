import { renderHook, act } from '@testing-library/react'
import { useDocument } from '../useDocument'

const mockDocumentSnapshot = {
  id: 'test-doc',
  exists: true,
  data: () => ({ name: 'Test Document', value: 42 }),
}

const mockDocumentRef = {
  onSnapshot: jest.fn(),
}

jest.mock('../../context', () => ({
  useFirebridge: jest.fn(),
}))

describe('useDocument', () => {
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
      useDocument(mockDocumentRef)
    )

    expect(result.current).toBeUndefined()
  })

  it('should return undefined when pathParts contains undefined values', () => {
    const { result } = renderHook(() => 
      useDocument(mockDocumentRef, ['part1', undefined, 'part3'])
    )

    expect(result.current).toBeUndefined()
  })

  it('should subscribe to document and return data when document exists', async () => {
    let onSnapshotCallback: any

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn() // unsubscribe function
    })

    const { result } = renderHook(() => 
      useDocument<{ name: string; value: number }>(mockDocumentRef)
    )

    expect(mockDocumentRef.onSnapshot).toHaveBeenCalled()

    // Simulate snapshot update
    act(() => {
      onSnapshotCallback(mockDocumentSnapshot)
    })

    expect(result.current).toEqual({
      id: 'test-doc',
      name: 'Test Document',
      value: 42,
    })
  })

  it('should return null when document does not exist', async () => {
    let onSnapshotCallback: any
    const nonExistentDoc = { ...mockDocumentSnapshot, exists: false }

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocument(mockDocumentRef)
    )

    act(() => {
      onSnapshotCallback(nonExistentDoc)
    })

    expect(result.current).toBeNull()
  })

  it('should handle document ref as a function', async () => {
    const mockRefFunction = jest.fn().mockReturnValue(mockDocumentRef)
    let onSnapshotCallback: any

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocument<{ name: string }>(mockRefFunction, ['path1', 'path2'])
    )

    expect(mockRefFunction).toHaveBeenCalledWith('test-uid', 'path1', 'path2')

    act(() => {
      onSnapshotCallback(mockDocumentSnapshot)
    })

    expect(result.current).toEqual({
      id: 'test-doc',
      name: 'Test Document',
      value: 42,
    })
  })

  it('should handle errors from Firestore', () => {
    let onErrorCallback: any

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onErrorCallback = onError
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocument(mockDocumentRef)
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

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocument(mockDocumentRef)
    )

    act(() => {
      onSnapshotCallback(null)
    })

    expect(result.current).toBeUndefined()
  })

  it('should unsubscribe when dependencies change', () => {
    const unsubscribe = jest.fn()
    mockDocumentRef.onSnapshot.mockReturnValue(unsubscribe)

    const { rerender } = renderHook(
      ({ pathParts }) => useDocument(mockDocumentRef, pathParts),
      { initialProps: { pathParts: ['path1'] } }
    )

    rerender({ pathParts: ['path2'] })

    expect(unsubscribe).toHaveBeenCalled()
  })
})