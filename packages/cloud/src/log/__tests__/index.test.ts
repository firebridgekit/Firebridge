import { LogService } from '../index'
import * as firebaseFunctions from 'firebase-functions/logger'
import * as params from 'firebase-functions/params'

jest.mock('firebase-functions/logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('firebase-functions/params', () => ({
  defineBoolean: jest.fn(() => ({
    value: jest.fn(() => false),
  })),
}))

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  time: console.time,
  timeLog: console.timeLog,
  timeEnd: console.timeEnd,
}

describe('LogService', () => {
  let logService: LogService
  let mockCallbacks: {
    onError: jest.Mock
    onWarn: jest.Mock
    onInfo: jest.Mock
    onDebug: jest.Mock
    onLog: jest.Mock
    onVerbose: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    console.log = jest.fn()
    console.error = jest.fn()
    console.warn = jest.fn()
    console.info = jest.fn()
    console.debug = jest.fn()
    console.time = jest.fn()
    console.timeLog = jest.fn()
    console.timeEnd = jest.fn()

    mockCallbacks = {
      onError: jest.fn(),
      onWarn: jest.fn(),
      onInfo: jest.fn(),
      onDebug: jest.fn(),
      onLog: jest.fn(),
      onVerbose: jest.fn(),
    }

    logService = new LogService('TestService', mockCallbacks)
  })

  afterEach(() => {
    console.log = originalConsole.log
    console.error = originalConsole.error
    console.warn = originalConsole.warn
    console.info = originalConsole.info
    console.debug = originalConsole.debug
    console.time = originalConsole.time
    console.timeLog = originalConsole.timeLog
    console.timeEnd = originalConsole.timeEnd
  })

  describe('constructor', () => {
    it('should initialize with name and callbacks', () => {
      expect(logService.name).toBe('TestService')
      expect(logService.onError).toBe(mockCallbacks.onError)
      expect(logService.onWarn).toBe(mockCallbacks.onWarn)
      expect(logService.onInfo).toBe(mockCallbacks.onInfo)
      expect(logService.onDebug).toBe(mockCallbacks.onDebug)
      expect(logService.onLog).toBe(mockCallbacks.onLog)
      expect(logService.onVerbose).toBe(mockCallbacks.onVerbose)
    })
  })

  describe('prefix', () => {
    it('should format message with service name', () => {
      expect(logService.prefix('test message')).toBe('[TestService] test message')
      expect(logService.prefix('')).toBe('[TestService] ')
      expect(logService.prefix()).toBe('[TestService] undefined')
    })
  })

  describe('logging methods', () => {
    describe('print', () => {
      it('should call onLog callback and firebase log with prefixed message', () => {
        const message = 'Test print message'
        const args = ['arg1', 'arg2']
        
        logService.print(message, ...args)
        
        expect(mockCallbacks.onLog).toHaveBeenCalledWith('[TestService] Test print message', 'arg1', 'arg2')
        expect(firebaseFunctions.log).toHaveBeenCalledWith('[TestService] Test print message', 'arg1', 'arg2')
      })
    })

    describe('info', () => {
      it('should call onInfo callback and firebase info with prefixed message', () => {
        const message = 'Test info message'
        const args = [{ data: 'test' }]
        
        logService.info(message, ...args)
        
        expect(mockCallbacks.onInfo).toHaveBeenCalledWith('[TestService] Test info message', { data: 'test' })
        expect(firebaseFunctions.info).toHaveBeenCalledWith('[TestService] Test info message', { data: 'test' })
      })
    })

    describe('error', () => {
      it('should call onError callback and firebase error with prefixed message', () => {
        const message = 'Test error message'
        const error = new Error('Test error')
        
        logService.error(message, error)
        
        expect(mockCallbacks.onError).toHaveBeenCalledWith('[TestService] Test error message', error)
        expect(firebaseFunctions.error).toHaveBeenCalledWith('[TestService] Test error message', error)
      })
    })

    describe('warn', () => {
      it('should call onWarn callback and firebase warn with prefixed message', () => {
        const message = 'Test warning'
        
        logService.warn(message)
        
        expect(mockCallbacks.onWarn).toHaveBeenCalledWith('[TestService] Test warning')
        expect(firebaseFunctions.warn).toHaveBeenCalledWith('[TestService] Test warning')
      })
    })

    describe('debug', () => {
      it('should call onDebug callback and firebase debug with prefixed message', () => {
        const message = 'Debug info'
        const debugData = { step: 1, status: 'running' }
        
        logService.debug(message, debugData)
        
        expect(mockCallbacks.onDebug).toHaveBeenCalledWith('[TestService] Debug info', debugData)
        expect(firebaseFunctions.debug).toHaveBeenCalledWith('[TestService] Debug info', debugData)
      })
    })

    describe('verbose', () => {
      it('should call onVerbose callback with prefixed message', () => {
        const message = 'Verbose output'
        
        logService.verbose(message)
        
        expect(mockCallbacks.onVerbose).toHaveBeenCalledWith('[TestService] Verbose output')
      })
    })
  })

  describe('timing methods', () => {
    describe('time', () => {
      it('should not call console.time when verbose is disabled', () => {
        logService.time('operation')
        expect(console.time).not.toHaveBeenCalled()
      })

    })

    describe('timeLog', () => {
      it('should not call console.timeLog when verbose is disabled', () => {
        logService.timeLog('operation')
        expect(console.timeLog).not.toHaveBeenCalled()
      })
    })

    describe('timeEnd', () => {
      it('should not call console.timeEnd when verbose is disabled', () => {
        logService.timeEnd('operation')
        expect(console.timeEnd).not.toHaveBeenCalled()
      })
    })
  })

  describe('start and end methods', () => {
    describe('start', () => {
      it('should call time and verbose with start emoji', () => {
        const startSpy = jest.spyOn(logService, 'time')
        const verboseSpy = jest.spyOn(logService, 'verbose')
        
        logService.start('process1', 'process2')
        
        expect(startSpy).toHaveBeenCalledWith('run')
        expect(verboseSpy).toHaveBeenCalledWith('▶️ start', 'process1', 'process2')
      })
    })

    describe('end', () => {
      it('should call timeEnd and verbose with end emoji', () => {
        const timeEndSpy = jest.spyOn(logService, 'timeEnd')
        const verboseSpy = jest.spyOn(logService, 'verbose')
        
        logService.end('result1', 'result2')
        
        expect(timeEndSpy).toHaveBeenCalledWith('run')
        expect(verboseSpy).toHaveBeenCalledWith('⏹️ end', 'result1', 'result2')
      })
    })
  })

  describe('calledBeforeInitialized', () => {
    it('should return a function that logs error when called', () => {
      const uninitializedFunc = logService.calledBeforeInitialized('myFunction')
      
      expect(typeof uninitializedFunc).toBe('function')
      
      const errorSpy = jest.spyOn(logService, 'error')
      uninitializedFunc()
      
      expect(errorSpy).not.toHaveBeenCalled()
    })

    it('should log error when verbose is enabled and function is called', () => {
      jest.clearAllMocks()
      const mockIsVerbose = params.defineBoolean as jest.Mock
      const valueMock = jest.fn(() => true)
      mockIsVerbose.mockReturnValue({
        value: valueMock,
      })
      
      jest.isolateModules(() => {
        const { LogService: IsolatedLogService } = require('../index')
        const verboseService = new IsolatedLogService('VerboseService', mockCallbacks)
        const errorSpy = jest.spyOn(verboseService, 'error')
        
        const uninitializedFunc = verboseService.calledBeforeInitialized('myFunction')
        uninitializedFunc()
        
        expect(errorSpy).toHaveBeenCalledWith('Function myFunction was called before it was initialized')
      })
    })
  })

  describe('multiple service instances', () => {
    it('should maintain separate names and callbacks', () => {
      const service1Callbacks = {
        onError: jest.fn(),
        onWarn: jest.fn(),
        onInfo: jest.fn(),
        onDebug: jest.fn(),
        onLog: jest.fn(),
        onVerbose: jest.fn(),
      }
      
      const service2Callbacks = {
        onError: jest.fn(),
        onWarn: jest.fn(),
        onInfo: jest.fn(),
        onDebug: jest.fn(),
        onLog: jest.fn(),
        onVerbose: jest.fn(),
      }
      
      const service1 = new LogService('Service1', service1Callbacks)
      const service2 = new LogService('Service2', service2Callbacks)
      
      service1.info('message1')
      service2.info('message2')
      
      expect(service1Callbacks.onInfo).toHaveBeenCalledWith('[Service1] message1')
      expect(service2Callbacks.onInfo).toHaveBeenCalledWith('[Service2] message2')
      expect(service1Callbacks.onInfo).not.toHaveBeenCalledWith('[Service2] message2')
      expect(service2Callbacks.onInfo).not.toHaveBeenCalledWith('[Service1] message1')
    })
  })

  describe('edge cases', () => {
    it('should handle undefined messages', () => {
      logService.info(undefined as any)
      
      expect(mockCallbacks.onInfo).toHaveBeenCalledWith('[TestService] undefined')
      expect(firebaseFunctions.info).toHaveBeenCalledWith('[TestService] undefined')
    })

    it('should handle null arguments', () => {
      logService.info('message', null)
      
      expect(mockCallbacks.onInfo).toHaveBeenCalledWith('[TestService] message', null)
      expect(firebaseFunctions.info).toHaveBeenCalledWith('[TestService] message', null)
    })

    it('should handle complex objects', () => {
      const complexObject = {
        nested: {
          deeply: {
            value: 'test',
            array: [1, 2, 3],
          },
        },
        circular: null as any,
      }
      complexObject.circular = complexObject
      
      logService.debug('complex', complexObject)
      
      expect(mockCallbacks.onDebug).toHaveBeenCalledWith('[TestService] complex', complexObject)
      expect(firebaseFunctions.debug).toHaveBeenCalledWith('[TestService] complex', complexObject)
    })
  })
})