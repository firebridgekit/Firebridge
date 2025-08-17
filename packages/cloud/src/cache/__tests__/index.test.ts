import { WriteResult } from 'firebase-admin/firestore'
import { Cache } from '../index'
import * as actions from '../../actions'

jest.mock('../../actions', () => ({
  firestoreGet: jest.fn(),
  firestoreSet: jest.fn(),
}))

describe('Cache', () => {
  let cache: Cache<any>
  const namespace = 'test-namespace'
  const mockGet = actions.firestoreGet as jest.MockedFunction<typeof actions.firestoreGet>
  const mockSet = actions.firestoreSet as jest.MockedFunction<typeof actions.firestoreSet>

  beforeEach(() => {
    jest.clearAllMocks()
    cache = new Cache(namespace)
  })

  describe('constructor', () => {
    it('should initialize with correct path', () => {
      expect(cache.path).toBe(`cache/${namespace}/values`)
    })

    it('should create hash, get, and set methods', () => {
      expect(cache.hash).toBeDefined()
      expect(cache.get).toBeDefined()
      expect(cache.set).toBeDefined()
    })
  })

  describe('hash', () => {
    it('should generate consistent SHA256 hash for strings', () => {
      const key = 'test-key'
      const hash1 = cache.hash(key)
      const hash2 = cache.hash(key)
      
      expect(hash1).toBe(hash2)
      expect(hash1).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate different hashes for different keys', () => {
      const hash1 = cache.hash('key1')
      const hash2 = cache.hash('key2')
      
      expect(hash1).not.toBe(hash2)
    })

    it('should throw error for non-string keys', () => {
      expect(() => cache.hash(123 as any)).toThrow('Key must be a string')
      expect(() => cache.hash(null as any)).toThrow('Key must be a string')
      expect(() => cache.hash(undefined as any)).toThrow('Key must be a string')
      expect(() => cache.hash({} as any)).toThrow('Key must be a string')
    })

    it('should throw error for empty string key', () => {
      expect(() => cache.hash('')).toThrow('Key must not be empty')
    })
  })

  describe('get', () => {
    it('should call firestoreGet with correct path and hashed key', async () => {
      const key = 'test-key'
      const expectedHash = cache.hash(key)
      const mockValue = { data: 'test-data' }
      
      mockGet.mockReturnValue(jest.fn().mockResolvedValue(mockValue))
      
      const result = await cache.get(key)
      
      expect(mockGet).toHaveBeenCalledWith(cache.path)
      expect(mockGet(cache.path)).toHaveBeenCalledWith(expectedHash)
      expect(result).toBe(mockValue)
    })


    it('should return undefined for non-existent keys', async () => {
      mockGet.mockReturnValue(jest.fn().mockResolvedValue(undefined))
      
      const result = await cache.get('non-existent-key')
      
      expect(result).toBeUndefined()
    })

    it('should handle different data types', async () => {
      const testCases = [
        { data: 'string value' },
        { data: 123 },
        { data: true },
        { data: null },
        { data: { nested: { value: 'test' } } },
        { data: ['array', 'of', 'values'] },
      ]

      for (const testCase of testCases) {
        mockGet.mockReturnValue(jest.fn().mockResolvedValue(testCase))
        const result = await cache.get('key')
        expect(result).toEqual(testCase)
      }
    })
  })

  describe('set', () => {
    it('should call firestoreSet with correct path, hashed key, and value', async () => {
      const key = 'test-key'
      const value = { data: 'test-data' }
      const expectedHash = cache.hash(key)
      const mockWriteResult: WriteResult = {
        writeTime: { toDate: () => new Date() },
      } as any
      
      mockSet.mockReturnValue(jest.fn().mockResolvedValue(mockWriteResult))
      
      const result = await cache.set(key, value)
      
      expect(mockSet).toHaveBeenCalledWith(cache.path)
      expect(mockSet(cache.path)).toHaveBeenCalledWith(expectedHash, value)
      expect(result).toBe(mockWriteResult)
    })


    it('should handle different value types', async () => {
      const mockWriteResult: WriteResult = {
        writeTime: { toDate: () => new Date() },
      } as any
      
      const testValues = [
        'string value',
        123,
        true,
        null,
        { nested: { value: 'test' } },
        ['array', 'of', 'values'],
      ]

      mockSet.mockReturnValue(jest.fn().mockResolvedValue(mockWriteResult))

      for (const value of testValues) {
        const result = await cache.set('key', value)
        expect(result).toBe(mockWriteResult)
      }
    })
  })

  describe('typed cache', () => {
    interface UserData {
      id: string
      name: string
      age: number
    }

    it('should work with typed data', async () => {
      const typedCache = new Cache<UserData>('users')
      const userData: UserData = {
        id: '123',
        name: 'John Doe',
        age: 30,
      }
      
      mockGet.mockReturnValue(jest.fn().mockResolvedValue(userData))
      mockSet.mockReturnValue(jest.fn().mockResolvedValue({} as WriteResult))
      
      await typedCache.set('user-123', userData)
      const retrieved = await typedCache.get('user-123')
      
      expect(retrieved).toEqual(userData)
    })
  })

  describe('integration scenarios', () => {
    it('should handle cache miss and subsequent set', async () => {
      const key = 'cache-miss-key'
      const value = { cached: true }
      
      mockGet.mockReturnValue(jest.fn().mockResolvedValue(undefined))
      mockSet.mockReturnValue(jest.fn().mockResolvedValue({} as WriteResult))
      
      const initialGet = await cache.get(key)
      expect(initialGet).toBeUndefined()
      
      await cache.set(key, value)
      
      mockGet.mockReturnValue(jest.fn().mockResolvedValue(value))
      const subsequentGet = await cache.get(key)
      expect(subsequentGet).toEqual(value)
    })

    it('should handle multiple namespaces independently', () => {
      const cache1 = new Cache('namespace1')
      const cache2 = new Cache('namespace2')
      
      expect(cache1.path).toBe('cache/namespace1/values')
      expect(cache2.path).toBe('cache/namespace2/values')
      
      const key = 'same-key'
      const hash1 = cache1.hash(key)
      const hash2 = cache2.hash(key)
      
      expect(hash1).toBe(hash2)
      expect(cache1.path).not.toBe(cache2.path)
    })
  })
})