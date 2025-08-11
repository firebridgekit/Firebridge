import { https } from 'firebase-functions'
import { z } from 'zod'
import validate from '../validate'

describe('validate', () => {
  it('should pass validation when no schema is provided', async () => {
    await expect(validate({ any: 'data' })).resolves.toBeUndefined()
  })

  it('should pass validation when schema validates successfully', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().min(0),
    })
    
    await expect(
      validate({ name: 'John', age: 25 }, schema)
    ).resolves.toBeUndefined()
  })

  it('should throw HttpsError when validation fails with message', async () => {
    const schema = z.object({
      email: z.string().email(),
    })
    
    await expect(
      validate({ email: 'not-an-email' }, schema)
    ).rejects.toThrow(https.HttpsError)
    
    try {
      await validate({ email: 'not-an-email' }, schema)
    } catch (error: any) {
      expect(error.code).toBe('failed-precondition')
      expect(error.message).toContain('email')
    }
  })

  it('should throw HttpsError with empty message when validation error has no message', async () => {
    const schema = {
      parseAsync: jest.fn().mockRejectedValue({}),
    } as any
    
    await expect(validate({ test: 'data' }, schema)).rejects.toThrow(
      new https.HttpsError('failed-precondition', '')
    )
  })

  it('should handle complex validation schemas', async () => {
    const schema = z.object({
      user: z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
      }),
      items: z.array(
        z.object({
          id: z.number(),
          quantity: z.number().min(1),
        })
      ).optional(),
    })
    
    const validData = {
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      items: [
        { id: 1, quantity: 2 },
        { id: 2, quantity: 5 },
      ],
    }
    
    await expect(validate(validData, schema)).resolves.toBeUndefined()
    
    const invalidData = {
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid',
      },
      items: [{ id: 1, quantity: 0 }],
    }
    
    await expect(validate(invalidData, schema)).rejects.toThrow(https.HttpsError)
  })

  it('should handle validation with custom error messages', async () => {
    const schema = z.object({
      password: z.string()
        .min(8, 'Password must be at least 8 characters'),
    })
    
    try {
      await validate({ password: '123' }, schema)
    } catch (error: any) {
      expect(error.code).toBe('failed-precondition')
      expect(error.message).toContain('Password must be at least 8 characters')
    }
  })

  it('should handle null and undefined values', async () => {
    const schema = z.object({
      required: z.string(),
      optional: z.string().nullable().optional(),
    })
    
    await expect(
      validate({ required: 'present', optional: null }, schema)
    ).resolves.toBeUndefined()
    
    await expect(
      validate({ required: 'present' }, schema)
    ).resolves.toBeUndefined()
    
    await expect(
      validate({ optional: null }, schema)
    ).rejects.toThrow(https.HttpsError)
  })
})