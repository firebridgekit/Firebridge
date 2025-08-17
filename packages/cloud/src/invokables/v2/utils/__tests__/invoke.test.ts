import { HttpsError } from 'firebase-functions/v2/https'
import invoke from '../invoke'
import { AuthenticatedBody, InvokableAction } from '../../types'

describe('invoke (v2)', () => {
  const mockBody: AuthenticatedBody<{ name: string }> = {
    data: { name: 'test' },
    auth: { uid: 'test-user-123' },
    claims: { role: 'admin' },
  }

  it('should successfully invoke an action and return the response', async () => {
    const mockAction: InvokableAction<{ name: string }, { success: boolean }> =
      jest.fn(async body => ({ success: true }))

    const result = await invoke(mockAction, mockBody)

    expect(mockAction).toHaveBeenCalledWith(mockBody)
    expect(result).toEqual({ success: true })
  })

  it('should handle synchronous actions', async () => {
    const numberBody: AuthenticatedBody<number> = {
      data: 5,
      auth: { uid: 'test-user' },
    }
    const mockAction: InvokableAction<number, number> = jest.fn(
      body => body.data * 2,
    )

    const result = await invoke(mockAction, numberBody)

    expect(mockAction).toHaveBeenCalledWith(numberBody)
    expect(result).toBe(10)
  })

  it('should handle void return types', async () => {
    const mockAction: InvokableAction<string, void> = jest.fn()
    const stringBody: AuthenticatedBody<string> = {
      data: 'test',
      auth: { uid: 'test-user' },
    }

    const result = await invoke(mockAction, stringBody)

    expect(mockAction).toHaveBeenCalledWith(stringBody)
    expect(result).toBeUndefined()
  })

  it('should throw HttpsError when action throws an error with message', async () => {
    const errorMessage = 'Action failed'
    const mockAction: InvokableAction<any, any> = jest
      .fn()
      .mockRejectedValue(new Error(errorMessage))

    await expect(invoke(mockAction, mockBody)).rejects.toThrow(
      new HttpsError('unknown', errorMessage),
    )
  })

  it('should throw HttpsError with empty message when error has no message', async () => {
    const mockAction: InvokableAction<any, any> = jest
      .fn()
      .mockRejectedValue({})

    await expect(invoke(mockAction, mockBody)).rejects.toThrow(
      new HttpsError('unknown', ''),
    )
  })

  it('should throw HttpsError when action throws null', async () => {
    const mockAction: InvokableAction<any, any> = jest
      .fn()
      .mockRejectedValue(null)

    await expect(invoke(mockAction, mockBody)).rejects.toThrow(
      new HttpsError('unknown', ''),
    )
  })

  it('should pass through complex body correctly', async () => {
    const complexBody: AuthenticatedBody<{
      nested: { data: number[]; flag: boolean }
      timestamp: number
    }> = {
      data: {
        nested: {
          data: [1, 2, 3],
          flag: true,
        },
        timestamp: Date.now(),
      },
      auth: { uid: 'complex-user' },
      claims: { permissions: ['read', 'write'], level: 5 },
    }

    const mockAction: InvokableAction<typeof complexBody.data, string> =
      jest.fn(() => 'processed')

    const result = await invoke(mockAction, complexBody)

    expect(mockAction).toHaveBeenCalledWith(complexBody)
    expect(result).toBe('processed')
  })

  it('should handle authentication without claims', async () => {
    const bodyWithoutClaims: AuthenticatedBody<string> = {
      data: 'test',
      auth: { uid: 'simple-user' },
    }

    const mockAction: InvokableAction<string, string> = jest.fn(
      body => `User ${body.auth.uid} processed`,
    )

    const result = await invoke(mockAction, bodyWithoutClaims)

    expect(result).toBe('User simple-user processed')
  })
})
