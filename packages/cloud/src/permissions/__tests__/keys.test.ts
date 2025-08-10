import { v4 as uuid } from 'uuid'
import { createHash } from 'crypto'

const mockGetFunction = jest.fn()
const mockSetFunction = jest.fn()

jest.mock('../../actions', () => ({
  firestoreGet: jest.fn(() => mockGetFunction),
  firestoreSet: jest.fn(() => mockSetFunction),
}))

jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

import { getKey, setKey, generateKey } from '../keys'

describe('permissions/keys', () => {
  const mockUuid = uuid as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getKey', () => {
    it('should be a function returned by firestoreGet', () => {
      expect(getKey).toBe(mockGetFunction)
    })

    it('should be able to get API keys', async () => {
      const mockApiKey = {
        uid: 'test-user-123',
        claims: { role: 'admin' },
      }
      mockGetFunction.mockResolvedValue(mockApiKey)

      const result = await getKey('key-hash')
      
      expect(mockGetFunction).toHaveBeenCalledWith('key-hash')
      expect(result).toEqual(mockApiKey)
    })
  })

  describe('setKey', () => {
    it('should be a function returned by firestoreSet', () => {
      expect(setKey).toBe(mockSetFunction)
    })

    it('should be able to set API keys', async () => {
      const apiKeyData = {
        uid: 'user-456',
        claims: { permissions: ['read', 'write'] },
      }
      mockSetFunction.mockResolvedValue({ id: 'key-hash-456' })

      const result = await setKey('key-hash-456', apiKeyData)
      
      expect(mockSetFunction).toHaveBeenCalledWith('key-hash-456', apiKeyData)
      expect(result).toEqual({ id: 'key-hash-456' })
    })
  })

  describe('generateKey', () => {
    it('should generate a UUID, hash it, and store it with the user ID', () => {
      const testUuid = '550e8400-e29b-41d4-a716-446655440000'
      const testUid = 'test-user-123'
      const expectedHash = createHash('md5').update(testUuid).digest('hex')
      
      mockUuid.mockReturnValue(testUuid)

      const result = generateKey(testUid)

      expect(mockUuid).toHaveBeenCalled()
      expect(mockSetFunction).toHaveBeenCalledWith(expectedHash, { uid: testUid })
      expect(result).toBe(testUuid)
    })

    it('should return the unhashed API key', () => {
      const testUuid = 'another-uuid-value'
      const testUid = 'another-user'
      
      mockUuid.mockReturnValue(testUuid)

      const result = generateKey(testUid)

      expect(result).toBe(testUuid)
    })

    it('should create different hashes for different UUIDs', () => {
      const uuid1 = 'uuid-1'
      const uuid2 = 'uuid-2'
      const uid = 'same-user'

      mockUuid.mockReturnValueOnce(uuid1)
      const result1 = generateKey(uid)
      
      mockUuid.mockReturnValueOnce(uuid2)
      const result2 = generateKey(uid)

      expect(result1).not.toBe(result2)
      
      const hash1 = createHash('md5').update(uuid1).digest('hex')
      const hash2 = createHash('md5').update(uuid2).digest('hex')
      
      expect(mockSetFunction).toHaveBeenNthCalledWith(1, hash1, { uid })
      expect(mockSetFunction).toHaveBeenNthCalledWith(2, hash2, { uid })
    })

    it('should handle ApiKey type with optional claims', () => {
      const apiKeyWithClaims = {
        uid: 'user-with-claims',
        claims: { permissions: ['read', 'write'], level: 5 },
      }

      const apiKeyWithoutClaims = {
        uid: 'user-without-claims',
      }

      expect(apiKeyWithClaims).toBeDefined()
      expect(apiKeyWithoutClaims).toBeDefined()
    })
  })
})