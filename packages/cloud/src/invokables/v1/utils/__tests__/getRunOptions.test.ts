import { RuntimeOptions } from 'firebase-functions'

// Create a variable that can be changed by tests
let mockModeValue = ''

jest.mock('firebase-functions/params', () => ({
  defineString: jest.fn(() => mockModeValue),
}))

import getRunOptions from '../getRunOptions'

describe('getRunOptions', () => {
  beforeEach(() => {
    // Reset to empty string before each test
    mockModeValue = ''
  })

  it('should return default reset options when no modes are provided', () => {
    const result = getRunOptions()
    expect(result).toEqual({ minInstances: 0 })
  })

  it('should return default mode options when default mode is provided', () => {
    const modes = {
      default: { minInstances: 1, timeoutSeconds: 60 },
    }
    const result = getRunOptions(modes)
    expect(result).toEqual({ minInstances: 1, timeoutSeconds: 60 })
  })

  it('should return performance mode options when performance mode is active', () => {
    // Set the mode before importing/calling
    mockModeValue = 'performance'
    
    // Need to clear the module cache and re-import to get the new value
    jest.resetModules()
    jest.mock('firebase-functions/params', () => ({
      defineString: jest.fn(() => 'performance'),
    }))
    const getRunOptionsWithPerf = require('../getRunOptions').default
    
    const modes = {
      performance: { minInstances: 5, memory: '2GB' as const },
      default: { minInstances: 1, timeoutSeconds: 60 },
    }
    const result = getRunOptionsWithPerf(modes)
    expect(result).toEqual({
      minInstances: 5,
      memory: '2GB',
      timeoutSeconds: 60,
    })
  })

  it('should override default options with mode-specific options', () => {
    // Set the mode before importing/calling
    jest.resetModules()
    jest.mock('firebase-functions/params', () => ({
      defineString: jest.fn(() => 'performance'),
    }))
    const getRunOptionsWithPerf = require('../getRunOptions').default
    
    const modes = {
      performance: { minInstances: 10 },
      default: { minInstances: 2, timeoutSeconds: 30 },
    }
    const result = getRunOptionsWithPerf(modes)
    expect(result).toEqual({ minInstances: 10, timeoutSeconds: 30 })
  })

  it('should apply reset options when mode is not found', () => {
    mockModeValue = 'unknown'
    const modes = {
      performance: { minInstances: 5 },
      default: { timeoutSeconds: 60 },
    }
    const result = getRunOptions(modes)
    expect(result).toEqual({ minInstances: 0, timeoutSeconds: 60 })
  })

  it('should handle undefined mode correctly', () => {
    mockModeValue = undefined as any
    const modes = {
      performance: { minInstances: 5 },
      default: { timeoutSeconds: 60 },
    }
    const result = getRunOptions(modes)
    expect(result).toEqual({ minInstances: 0, timeoutSeconds: 60 })
  })

  it('should handle null mode correctly', () => {
    mockModeValue = null as any
    const modes = {
      performance: { minInstances: 5 },
      default: { timeoutSeconds: 60 },
    }
    const result = getRunOptions(modes)
    expect(result).toEqual({ minInstances: 0, timeoutSeconds: 60 })
  })
})