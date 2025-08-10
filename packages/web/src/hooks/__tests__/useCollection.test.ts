import { renderHook } from '@testing-library/react'
import { CollectionReference, Query, FirestoreError } from 'firebase/firestore'
import { useCollection as useFirebaseHooksCollection } from 'react-firebase-hooks/firestore'
import { useCollection } from '../useCollection'
import { useFirebridge } from '../../context'
import { readQuerySnapshot } from '../../utils'

jest.mock('react-firebase-hooks/firestore', () => ({
  useCollection: jest.fn(),
}))

jest.mock('../../context', () => ({
  useFirebridge: jest.fn(),
}))

jest.mock('../../utils', () => ({
  readQuerySnapshot: jest.fn(),
}))

describe('useCollection', () => {
  let mockUser: { uid: string } | null
  let mockLog: {
    error: jest.Mock
    warn: jest.Mock
    debug: jest.Mock
    print: jest.Mock
  }
  let mockCollectionRef: CollectionReference
  let mockSnapshot: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUser = { uid: 'test-uid-123' }
    mockLog = {
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      print: jest.fn(),
    }
    mockCollectionRef = {} as CollectionReference
    mockSnapshot = { docs: [] }

    ;(useFirebridge as jest.Mock).mockReturnValue({ user: mockUser, log: mockLog })
    ;(useFirebaseHooksCollection as jest.Mock).mockReturnValue([mockSnapshot, false, undefined])
    ;(readQuerySnapshot as jest.Mock).mockReturnValue([{ id: '1', data: 'test' }])
  })

  it('should return collection data when user is authenticated', () => {
    const { result } = renderHook(() => 
      useCollection(mockCollectionRef)
    )

    expect(useFirebaseHooksCollection).toHaveBeenCalledWith(mockCollectionRef)
    expect(readQuerySnapshot).toHaveBeenCalledWith(mockSnapshot)
    expect(result.current).toEqual([{ id: '1', data: 'test' }])
  })

  it('should use function to get reference with uid and path parts', () => {
    const getRef = jest.fn().mockReturnValue(mockCollectionRef)
    
    renderHook(() => 
      useCollection(getRef, ['pathPart1', 'pathPart2'])
    )

    expect(getRef).toHaveBeenCalledWith('test-uid-123', 'pathPart1', 'pathPart2')
    expect(useFirebaseHooksCollection).toHaveBeenCalledWith(mockCollectionRef)
  })

  it('should return undefined when user is not authenticated', () => {
    ;(useFirebridge as jest.Mock).mockReturnValue({ user: null, log: mockLog })
    ;(useFirebaseHooksCollection as jest.Mock).mockReturnValue([undefined, false, undefined])

    const { result } = renderHook(() => 
      useCollection(mockCollectionRef)
    )

    expect(useFirebaseHooksCollection).toHaveBeenCalledWith(undefined)
    expect(result.current).toBeUndefined()
  })

  it('should return undefined when path parts include undefined', () => {
    const getRef = jest.fn()
    ;(useFirebaseHooksCollection as jest.Mock).mockReturnValue([undefined, false, undefined])
    
    const { result } = renderHook(() => 
      useCollection(getRef, ['pathPart1', undefined, 'pathPart3'])
    )

    expect(getRef).not.toHaveBeenCalled()
    expect(useFirebaseHooksCollection).toHaveBeenCalledWith(undefined)
    expect(result.current).toBeUndefined()
  })

  it('should return undefined while loading', () => {
    ;(useFirebaseHooksCollection as jest.Mock).mockReturnValue([undefined, true, undefined])

    const { result } = renderHook(() => 
      useCollection(mockCollectionRef)
    )

    expect(result.current).toBeUndefined()
    expect(readQuerySnapshot).not.toHaveBeenCalled()
  })

  it('should handle errors and call onError callback', () => {
    const mockError: FirestoreError = {
      code: 'permission-denied',
      message: 'Permission denied',
      name: 'FirestoreError',
    }
    const onError = jest.fn()
    
    ;(useFirebaseHooksCollection as jest.Mock).mockReturnValue([undefined, false, mockError])

    const { result } = renderHook(() => 
      useCollection(mockCollectionRef, [], { onError })
    )

    expect(mockLog.error).toHaveBeenCalledWith(mockError)
    expect(onError).toHaveBeenCalledWith(mockError)
    expect(result.current).toBeUndefined()
  })

  it('should return undefined when snapshot is null', () => {
    ;(useFirebaseHooksCollection as jest.Mock).mockReturnValue([null, false, undefined])

    const { result } = renderHook(() => 
      useCollection(mockCollectionRef)
    )

    expect(result.current).toBeUndefined()
    expect(readQuerySnapshot).not.toHaveBeenCalled()
  })

  it('should handle Query type reference', () => {
    const mockQuery = {} as Query
    ;(useFirebaseHooksCollection as jest.Mock).mockReturnValue([mockSnapshot, false, undefined])

    renderHook(() => 
      useCollection(mockQuery)
    )

    expect(useFirebaseHooksCollection).toHaveBeenCalledWith(mockQuery)
  })

  it('should re-evaluate reference when dependencies change', () => {
    const getRef = jest.fn().mockReturnValue(mockCollectionRef)
    
    const { rerender } = renderHook(
      ({ pathPart }) => useCollection(getRef, [pathPart]),
      { initialProps: { pathPart: 'part1' } }
    )

    expect(getRef).toHaveBeenCalledWith('test-uid-123', 'part1')
    
    rerender({ pathPart: 'part2' })
    
    expect(getRef).toHaveBeenCalledWith('test-uid-123', 'part2')
  })

  it('should handle empty path parts array', () => {
    const getRef = jest.fn().mockReturnValue(mockCollectionRef)
    
    renderHook(() => 
      useCollection(getRef, [])
    )

    expect(getRef).toHaveBeenCalledWith('test-uid-123')
  })

  it('should handle undefined getRef', () => {
    ;(useFirebaseHooksCollection as jest.Mock).mockReturnValue([undefined, false, undefined])
    
    const { result } = renderHook(() => 
      useCollection(undefined)
    )

    expect(useFirebaseHooksCollection).toHaveBeenCalledWith(undefined)
    expect(result.current).toBeUndefined()
  })

  it('should properly type collection data', () => {
    interface TestData {
      name: string
      age: number
    }

    const typedData: TestData[] = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ]

    ;(readQuerySnapshot as jest.Mock).mockReturnValue(typedData)

    const { result } = renderHook(() => 
      useCollection<TestData>(mockCollectionRef)
    )

    expect(result.current).toEqual(typedData)
  })
})