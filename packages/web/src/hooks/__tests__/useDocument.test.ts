import { renderHook } from '@testing-library/react'
import { DocumentReference, FirestoreError } from 'firebase/firestore'
import { useDocument as useFirebaseHooksDocument } from 'react-firebase-hooks/firestore'
import { useDocument } from '../useDocument'
import { useFirebridge } from '../../context'
import { readSnapshot } from '../../utils'

jest.mock('react-firebase-hooks/firestore', () => ({
  useDocument: jest.fn(),
}))

jest.mock('../../context', () => ({
  useFirebridge: jest.fn(),
}))

jest.mock('../../utils', () => ({
  readSnapshot: jest.fn(),
}))

describe('useDocument', () => {
  let mockUser: { uid: string } | null
  let mockLog: {
    error: jest.Mock
    warn: jest.Mock
    debug: jest.Mock
    print: jest.Mock
  }
  let mockDocumentRef: DocumentReference
  let mockDocument: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUser = { uid: 'test-uid-456' }
    mockLog = {
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      print: jest.fn(),
    }
    mockDocumentRef = {} as DocumentReference
    mockDocument = { exists: () => true, id: 'doc-1', data: () => ({ field: 'value' }) }

    ;(useFirebridge as jest.Mock).mockReturnValue({ user: mockUser, log: mockLog })
    ;(useFirebaseHooksDocument as jest.Mock).mockReturnValue([mockDocument, false, undefined])
    ;(readSnapshot as jest.Mock).mockReturnValue({ id: 'doc-1', field: 'value' })
  })

  it('should return document data when user is authenticated', () => {
    const { result } = renderHook(() => 
      useDocument(mockDocumentRef)
    )

    expect(useFirebaseHooksDocument).toHaveBeenCalledWith(mockDocumentRef)
    expect(readSnapshot).toHaveBeenCalledWith(mockDocument)
    expect(result.current).toEqual({ id: 'doc-1', field: 'value' })
  })

  it('should use function to get reference with uid and path parts', () => {
    const getRef = jest.fn().mockReturnValue(mockDocumentRef)
    
    renderHook(() => 
      useDocument(getRef, ['collection', 'docId'])
    )

    expect(getRef).toHaveBeenCalledWith('test-uid-456', 'collection', 'docId')
    expect(useFirebaseHooksDocument).toHaveBeenCalledWith(mockDocumentRef)
  })

  it('should return undefined when user is not authenticated', () => {
    ;(useFirebridge as jest.Mock).mockReturnValue({ user: null, log: mockLog })
    ;(useFirebaseHooksDocument as jest.Mock).mockReturnValue([undefined, false, undefined])

    const { result } = renderHook(() => 
      useDocument(mockDocumentRef)
    )

    expect(useFirebaseHooksDocument).toHaveBeenCalledWith(undefined)
    expect(result.current).toBeUndefined()
  })

  it('should return undefined when path parts include undefined', () => {
    const getRef = jest.fn()
    ;(useFirebaseHooksDocument as jest.Mock).mockReturnValue([undefined, false, undefined])
    
    const { result } = renderHook(() => 
      useDocument(getRef, ['part1', undefined, 'part3'])
    )

    expect(getRef).not.toHaveBeenCalled()
    expect(useFirebaseHooksDocument).toHaveBeenCalledWith(undefined)
    expect(result.current).toBeUndefined()
  })

  it('should return undefined while loading', () => {
    ;(useFirebaseHooksDocument as jest.Mock).mockReturnValue([undefined, true, undefined])

    const { result } = renderHook(() => 
      useDocument(mockDocumentRef)
    )

    expect(result.current).toBeUndefined()
    expect(readSnapshot).not.toHaveBeenCalled()
  })

  it('should handle errors and call onError callback', () => {
    const mockError: FirestoreError = {
      code: 'not-found',
      message: 'Document not found',
      name: 'FirestoreError',
    }
    const onError = jest.fn()
    
    // Pass a mock document so the !doc check doesn't trigger first
    const mockDoc = { exists: () => true, id: 'test-doc' }
    ;(useFirebaseHooksDocument as jest.Mock).mockReturnValue([mockDoc, false, mockError])

    const { result } = renderHook(() => 
      useDocument(mockDocumentRef, [], { onError })
    )

    expect(mockLog.error).toHaveBeenCalledWith(mockError)
    expect(onError).toHaveBeenCalledWith(mockError)
    expect(result.current).toBeUndefined()
  })

  it('should return undefined when document is null', () => {
    ;(useFirebaseHooksDocument as jest.Mock).mockReturnValue([null, false, undefined])

    const { result } = renderHook(() => 
      useDocument(mockDocumentRef)
    )

    expect(result.current).toBeUndefined()
    expect(readSnapshot).not.toHaveBeenCalled()
  })

  it('should handle non-existent document', () => {
    const nonExistentDoc = { exists: () => false, id: 'doc-2' }
    ;(useFirebaseHooksDocument as jest.Mock).mockReturnValue([nonExistentDoc, false, undefined])
    ;(readSnapshot as jest.Mock).mockReturnValue(null)

    const { result } = renderHook(() => 
      useDocument(mockDocumentRef)
    )

    expect(readSnapshot).toHaveBeenCalledWith(nonExistentDoc)
    expect(result.current).toBeNull()
  })

  it('should re-evaluate reference when dependencies change', () => {
    const getRef = jest.fn().mockReturnValue(mockDocumentRef)
    
    const { rerender } = renderHook(
      ({ docId }) => useDocument(getRef, [docId]),
      { initialProps: { docId: 'doc1' } }
    )

    expect(getRef).toHaveBeenCalledWith('test-uid-456', 'doc1')
    
    rerender({ docId: 'doc2' })
    
    expect(getRef).toHaveBeenCalledWith('test-uid-456', 'doc2')
  })

  it('should handle empty path parts array', () => {
    const getRef = jest.fn().mockReturnValue(mockDocumentRef)
    
    renderHook(() => 
      useDocument(getRef, [])
    )

    expect(getRef).toHaveBeenCalledWith('test-uid-456')
  })

  it('should handle undefined getRef', () => {
    ;(useFirebaseHooksDocument as jest.Mock).mockReturnValue([undefined, false, undefined])
    
    const { result } = renderHook(() => 
      useDocument(undefined)
    )

    expect(useFirebaseHooksDocument).toHaveBeenCalledWith(undefined)
    expect(result.current).toBeUndefined()
  })

  it('should properly type document data', () => {
    interface UserProfile {
      name: string
      email: string
      age: number
    }

    const typedData: UserProfile = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    }

    ;(readSnapshot as jest.Mock).mockReturnValue(typedData)

    const { result } = renderHook(() => 
      useDocument<UserProfile>(mockDocumentRef)
    )

    expect(result.current).toEqual(typedData)
  })

  it('should handle document with only uid parameter', () => {
    const getRef = jest.fn().mockReturnValue(mockDocumentRef)
    
    renderHook(() => 
      useDocument((uid) => getRef(uid))
    )

    expect(getRef).toHaveBeenCalledWith('test-uid-456')
  })
})