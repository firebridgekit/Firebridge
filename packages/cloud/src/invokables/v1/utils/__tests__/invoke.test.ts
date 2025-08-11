import { https } from 'firebase-functions'
import invoke from '../invoke'
import { AuthenticatedContext, InvokableActionV1 } from '../../type'

describe('invoke', () => {
  const mockContext: AuthenticatedContext = {
    auth: { uid: 'test-user-123' },
    claims: { role: 'admin' },
  }

  it('should successfully invoke an action and return the response', async () => {
    const mockAction: InvokableActionV1<{ name: string }, { success: boolean }> = jest.fn(
      async (body, context) => ({ success: true })
    )
    
    const result = await invoke(mockAction, { name: 'test' }, mockContext)
    
    expect(mockAction).toHaveBeenCalledWith({ name: 'test' }, mockContext)
    expect(result).toEqual({ success: true })
  })

  it('should handle synchronous actions', async () => {
    const mockAction: InvokableActionV1<number, number> = jest.fn((body) => body * 2)
    
    const result = await invoke(mockAction, 5, mockContext)
    
    expect(mockAction).toHaveBeenCalledWith(5, mockContext)
    expect(result).toBe(10)
  })

  it('should handle void return types', async () => {
    const mockAction: InvokableActionV1<string, void> = jest.fn()
    
    const result = await invoke(mockAction, 'test', mockContext)
    
    expect(mockAction).toHaveBeenCalledWith('test', mockContext)
    expect(result).toBeUndefined()
  })

  it('should throw HttpsError when action throws an error with message', async () => {
    const errorMessage = 'Action failed'
    const mockAction: InvokableActionV1<any, any> = jest.fn().mockRejectedValue(
      new Error(errorMessage)
    )
    
    await expect(invoke(mockAction, {}, mockContext)).rejects.toThrow(
      new https.HttpsError('unknown', errorMessage)
    )
  })

  it('should throw HttpsError with empty message when error has no message', async () => {
    const mockAction: InvokableActionV1<any, any> = jest.fn().mockRejectedValue({})
    
    await expect(invoke(mockAction, {}, mockContext)).rejects.toThrow(
      new https.HttpsError('unknown', '')
    )
  })

  it('should throw HttpsError when action throws null', async () => {
    const mockAction: InvokableActionV1<any, any> = jest.fn().mockRejectedValue(null)
    
    await expect(invoke(mockAction, {}, mockContext)).rejects.toThrow(
      new https.HttpsError('unknown', '')
    )
  })

  it('should pass through complex body and context correctly', async () => {
    const complexBody = {
      nested: {
        data: [1, 2, 3],
        flag: true,
      },
      timestamp: Date.now(),
    }
    const complexContext: AuthenticatedContext = {
      auth: { uid: 'complex-user' },
      claims: { permissions: ['read', 'write'], level: 5 },
    }
    
    const mockAction: InvokableActionV1<typeof complexBody, string> = jest.fn(
      () => 'processed'
    )
    
    const result = await invoke(mockAction, complexBody, complexContext)
    
    expect(mockAction).toHaveBeenCalledWith(complexBody, complexContext)
    expect(result).toBe('processed')
  })
})