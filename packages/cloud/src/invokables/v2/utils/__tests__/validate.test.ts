import { HttpsError } from 'firebase-functions/v2/https'
import * as Yup from 'yup'
import validate from '../validate'

describe('validate (v2)', () => {
  it('should pass validation when no schema is provided', async () => {
    await expect(validate({ any: 'data' })).resolves.toBeUndefined()
  })

  it('should pass validation when schema validates successfully', async () => {
    const schema = Yup.object({
      name: Yup.string().required(),
      age: Yup.number().min(0).required(),
    })
    
    await expect(
      validate({ name: 'John', age: 25 }, schema)
    ).resolves.toBeUndefined()
  })

  it('should throw HttpsError when validation fails with message', async () => {
    const schema = Yup.object({
      email: Yup.string().email().required(),
    })
    
    await expect(
      validate({ email: 'not-an-email' }, schema)
    ).rejects.toThrow(HttpsError)
    
    try {
      await validate({ email: 'not-an-email' }, schema)
    } catch (error: any) {
      expect(error.code).toBe('failed-precondition')
      expect(error.message).toContain('email')
    }
  })

  it('should throw HttpsError with default message when validation error has no message', async () => {
    const schema = {
      validate: jest.fn().mockRejectedValue({}),
    } as any
    
    await expect(validate({ test: 'data' }, schema)).rejects.toThrow(
      new HttpsError('failed-precondition', 'failed validation')
    )
  })

  it('should handle complex validation schemas', async () => {
    const schema = Yup.object({
      user: Yup.object({
        firstName: Yup.string().required(),
        lastName: Yup.string().required(),
        email: Yup.string().email().required(),
      }),
      items: Yup.array().of(
        Yup.object({
          id: Yup.number().required(),
          quantity: Yup.number().min(1).required(),
        })
      ),
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
    
    await expect(validate(invalidData, schema)).rejects.toThrow(HttpsError)
  })

  it('should handle validation with custom error messages', async () => {
    const schema = Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    })
    
    try {
      await validate({ password: '123' }, schema)
    } catch (error: any) {
      expect(error.code).toBe('failed-precondition')
      expect(error.message).toContain('Password must be at least 8 characters')
    }
  })

  it('should handle null and undefined values', async () => {
    const schema = Yup.object({
      required: Yup.string().required(),
      optional: Yup.string().nullable(),
    })
    
    await expect(
      validate({ required: 'present', optional: null }, schema)
    ).resolves.toBeUndefined()
    
    await expect(
      validate({ required: 'present' }, schema)
    ).resolves.toBeUndefined()
    
    await expect(
      validate({ optional: null }, schema)
    ).rejects.toThrow(HttpsError)
  })

  it('should handle validation errors with null', async () => {
    const schema = {
      validate: jest.fn().mockRejectedValue(null),
    } as any
    
    await expect(validate({ test: 'data' }, schema)).rejects.toThrow(
      new HttpsError('failed-precondition', 'failed validation')
    )
  })
})