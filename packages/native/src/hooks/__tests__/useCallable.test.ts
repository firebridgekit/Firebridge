import { renderHook, act } from '@testing-library/react'
import functions from '@react-native-firebase/functions'
import React from 'react'
import { useCallable } from '../useCallable'

jest.mock('@react-native-firebase/functions')
jest.mock('../../context', () => ({
  useFirebridge: jest.fn(),
}))

describe('useCallable', () => {
  let mockFunctions: any
  let mockCallable: jest.Mock
  let mockLog: {
    error: jest.Mock
    warn: jest.Mock
    debug: jest.Mock
    print: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockCallable = jest.fn()
    mockLog = {
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      print: jest.fn(),
    }

    mockFunctions = {
      httpsCallable: jest.fn().mockReturnValue(mockCallable)
    }

    ;(functions as jest.Mock).mockReturnValue(mockFunctions)
    
    const { useFirebridge } = require('../../context')
    useFirebridge.mockReturnValue({ log: mockLog })
  })

  it('should create a callable function', () => {
    const { result } = renderHook(() => 
      useCallable<{ input: string }, { output: string }>('testFunction')
    )

    expect(mockFunctions.httpsCallable).toHaveBeenCalledWith('testFunction')
    expect(typeof result.current).toBe('function')
  })

  it('should call the cloud function with body and return response', async () => {
    const mockResponse = { data: { output: 'test result' } }
    mockCallable.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => 
      useCallable<{ input: string }, { output: string }>('testFunction')
    )

    let response: { output: string } | undefined
    await act(async () => {
      response = await result.current({ input: 'test input' })
    })

    expect(mockCallable).toHaveBeenCalledWith({ input: 'test input' })
    expect(response).toEqual({ output: 'test result' })
  })

  it('should log the function call', async () => {
    mockCallable.mockResolvedValue({ data: {} })

    const { result } = renderHook(() => 
      useCallable<{ input: string }, void>('testFunction')
    )

    await act(async () => {
      await result.current({ input: 'test input' })
    })

    expect(mockLog.debug).toHaveBeenCalledWith('[Cloud Callable]: testFunction', { input: 'test input' })
  })

  it('should handle function calls without body', async () => {
    mockCallable.mockResolvedValue({ data: { result: 'success' } })

    const { result } = renderHook(() => 
      useCallable<undefined, { result: string }>('noBodyFunction')
    )

    let response: { result: string } | undefined
    await act(async () => {
      response = await result.current()
    })

    expect(mockCallable).toHaveBeenCalledWith({})
    expect(response).toEqual({ result: 'success' })
    expect(mockLog.debug).toHaveBeenCalledWith('[Cloud Callable]: noBodyFunction', {})
  })

  it('should handle errors from cloud function', async () => {
    const mockError = new Error('Function error')
    mockCallable.mockRejectedValue(mockError)

    const { result } = renderHook(() => 
      useCallable('errorFunction')
    )

    await expect(result.current()).rejects.toThrow('Function error')
  })

  it('should memoize the callable function', () => {
    const { result, rerender } = renderHook(() => 
      useCallable('memoizedFunction')
    )

    const firstRender = result.current

    rerender()

    expect(result.current).toBe(firstRender)
  })

  it('should create new callable when function name changes', () => {
    const { result, rerender } = renderHook(
      ({ name }) => useCallable(name),
      { initialProps: { name: 'function1' } }
    )

    const firstRender = result.current

    rerender({ name: 'function2' })

    expect(result.current).not.toBe(firstRender)
    expect(mockFunctions.httpsCallable).toHaveBeenCalledWith('function2')
  })
})