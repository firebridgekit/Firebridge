const mockGetFunction = jest.fn()
const mockSetFunction = jest.fn()
const mockMergeFunction = jest.fn()

jest.mock('../../actions', () => ({
  firestoreGet: jest.fn(() => mockGetFunction),
  firestoreSet: jest.fn(() => mockSetFunction),
  firestoreMerge: jest.fn(() => mockMergeFunction),
}))

import { getUserPermissions, setUserPermissions, mergeUserPermissions } from '../actions'
import { UserPermissions } from '../type'

describe('permissions/actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserPermissions', () => {
    it('should be a function returned by firestoreGet', () => {
      expect(getUserPermissions).toBe(mockGetFunction)
    })

    it('should be able to get user permissions', async () => {
      const mockPermissions: UserPermissions = {
        role: 'admin',
        isAdmin: true,
        scopes: { read: true, write: true },
      }
      mockGetFunction.mockResolvedValue(mockPermissions)

      const result = await getUserPermissions('user-123')
      
      expect(mockGetFunction).toHaveBeenCalledWith('user-123')
      expect(result).toEqual(mockPermissions)
    })
  })

  describe('setUserPermissions', () => {
    it('should be a function returned by firestoreSet', () => {
      expect(setUserPermissions).toBe(mockSetFunction)
    })

    it('should be able to set user permissions', async () => {
      const newPermissions: UserPermissions = {
        role: 'editor',
        isAdmin: false,
      }
      mockSetFunction.mockResolvedValue({ id: 'user-456' })

      const result = await setUserPermissions('user-456', newPermissions)
      
      expect(mockSetFunction).toHaveBeenCalledWith('user-456', newPermissions)
      expect(result).toEqual({ id: 'user-456' })
    })
  })

  describe('mergeUserPermissions', () => {
    it('should be a function returned by firestoreMerge', () => {
      expect(mergeUserPermissions).toBe(mockMergeFunction)
    })

    it('should be able to merge user permissions', async () => {
      const updatedPermissions: Partial<UserPermissions> = {
        scopes: { delete: true },
      }
      mockMergeFunction.mockResolvedValue({ id: 'user-789' })

      const result = await mergeUserPermissions('user-789', updatedPermissions)
      
      expect(mockMergeFunction).toHaveBeenCalledWith('user-789', updatedPermissions)
      expect(result).toEqual({ id: 'user-789' })
    })
  })

  it('should handle all UserPermissions types correctly', () => {
    const fullPermissions: UserPermissions = {
      role: 'editor',
      roles: { project1: 'admin', project2: 'viewer' },
      scopes: { create: true, delete: false },
      isAdmin: false,
    }

    const minimalPermissions: UserPermissions = {}

    const nullRolePermissions: UserPermissions = {
      role: null,
    }

    expect(fullPermissions).toBeDefined()
    expect(minimalPermissions).toBeDefined()
    expect(nullRolePermissions).toBeDefined()
  })
})