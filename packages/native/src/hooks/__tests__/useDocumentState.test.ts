import { renderHook, act } from '@testing-library/react'
import { useDocumentState } from '../useDocumentState'

const mockDocumentSnapshot = {
  id: 'test-doc',
  exists: true,
  data: () => ({ name: 'Test Document', value: 42 }),
}

const mockDocumentRef = {
  onSnapshot: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
}

jest.mock('../../context', () => ({
  useFirebridge: jest.fn(),
}))

describe('useDocumentState', () => {
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

    mockDocumentRef.set.mockResolvedValue(undefined)
    mockDocumentRef.delete.mockResolvedValue(undefined)

    const { useFirebridge } = require('../../context')
    useFirebridge.mockReturnValue({ user: mockUser, log: mockLog })
  })

  it('should return undefined value and setter when user is not authenticated', () => {
    const { useFirebridge } = require('../../context')
    useFirebridge.mockReturnValue({ user: null, log: mockLog })

    const { result } = renderHook(() => 
      useDocumentState(mockDocumentRef)
    )

    const [value, setValue] = result.current
    expect(value).toBeUndefined()
    expect(typeof setValue).toBe('function')
  })

  it('should subscribe to document and return current data', async () => {
    let onSnapshotCallback: any

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn() // unsubscribe function
    })

    const { result } = renderHook(() => 
      useDocumentState<{ name: string; value: number }>(mockDocumentRef)
    )

    expect(mockDocumentRef.onSnapshot).toHaveBeenCalled()

    // Simulate snapshot update
    act(() => {
      onSnapshotCallback(mockDocumentSnapshot)
    })

    const [value] = result.current
    expect(value).toEqual({
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
      useDocumentState(mockDocumentRef)
    )

    act(() => {
      onSnapshotCallback(nonExistentDoc)
    })

    const [value] = result.current
    expect(value).toBeNull()
  })

  it('should set document data using setValue', async () => {
    let onSnapshotCallback: any

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocumentState<{ name: string; value: number }>(mockDocumentRef)
    )

    const [, setValue] = result.current
    const newData = { name: 'Updated Document', value: 100 }

    await act(async () => {
      await setValue(newData)
    })

    expect(mockDocumentRef.set).toHaveBeenCalledWith(newData, undefined)
  })

  it('should merge document data when merge option is true', async () => {
    let onSnapshotCallback: any

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocumentState<{ name: string; value: number }>(mockDocumentRef)
    )

    // Set initial data
    act(() => {
      onSnapshotCallback(mockDocumentSnapshot)
    })

    const [, setValue] = result.current
    const updateData = { value: 100 }

    await act(async () => {
      await setValue(updateData, true)
    })

    expect(mockDocumentRef.set).toHaveBeenCalledWith(updateData, { merge: true })
  })

  it('should delete document when setValue is called with null', async () => {
    let onSnapshotCallback: any

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocumentState(mockDocumentRef)
    )

    const [, setValue] = result.current

    await act(async () => {
      await setValue(null)
    })

    expect(mockDocumentRef.delete).toHaveBeenCalled()
  })

  it('should handle document ref as a function', async () => {
    const mockRefFunction = jest.fn().mockReturnValue(mockDocumentRef)
    let onSnapshotCallback: any

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocumentState<{ name: string }>(mockRefFunction, ['path1', 'path2'])
    )

    expect(mockRefFunction).toHaveBeenCalledWith('test-uid', 'path1', 'path2')

    const [, setValue] = result.current
    const newData = { name: 'New Document' }

    await act(async () => {
      await setValue(newData)
    })

    expect(mockDocumentRef.set).toHaveBeenCalledWith(newData, undefined)
  })

  it('should not update when value is the same', async () => {
    let onSnapshotCallback: any
    const initialData = { name: 'Test Document', value: 42 }

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onSnapshotCallback = onNext
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocumentState<{ name: string; value: number }>(mockDocumentRef)
    )

    // Set initial data
    act(() => {
      onSnapshotCallback({ 
        ...mockDocumentSnapshot, 
        data: () => initialData 
      })
    })

    const [value, setValue] = result.current

    await act(async () => {
      await setValue(value)
    })

    expect(mockDocumentRef.set).not.toHaveBeenCalled()
  })

  it('should handle errors from Firestore', () => {
    let onErrorCallback: any

    mockDocumentRef.onSnapshot.mockImplementation((onNext, onError) => {
      onErrorCallback = onError
      return jest.fn()
    })

    const { result } = renderHook(() => 
      useDocumentState(mockDocumentRef)
    )

    const mockError = new Error('Firestore error')
    
    act(() => {
      onErrorCallback(mockError)
    })

    expect(mockLog.error).toHaveBeenCalledWith(mockError)
  })

  it('should not set value when user is not authenticated', async () => {
    const { useFirebridge } = require('../../context')
    useFirebridge.mockReturnValue({ user: null, log: mockLog })

    const { result } = renderHook(() => 
      useDocumentState(mockDocumentRef)
    )

    const [, setValue] = result.current

    await act(async () => {
      await setValue({ name: 'Test' })
    })

    expect(mockDocumentRef.set).not.toHaveBeenCalled()
  })

  it('should not set value when pathParts contains undefined', async () => {
    const { result } = renderHook(() => 
      useDocumentState(mockDocumentRef, ['part1', undefined, 'part3'])
    )

    const [, setValue] = result.current

    await act(async () => {
      await setValue({ name: 'Test' })
    })

    expect(mockDocumentRef.set).not.toHaveBeenCalled()
  })
})