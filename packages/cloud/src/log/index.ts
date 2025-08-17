import { defineBoolean } from 'firebase-functions/params'
import {
  log as friebaseLog,
  error as firebaseError,
  warn as firebaseWarn,
  info as firebaseInfo,
  debug as firebaseDebug,
} from 'firebase-functions/logger'

const isVerbose = defineBoolean('IS_VERBOSE_LOGGING', {
  default: false,
  label: 'Verbose Logging',
  description:
    '🚨 DO NOT use verbose logging in production. It will log sensitive data.',
})

const log = {
  error: (...args: any[]) => {
    if (isVerbose.value()) console.error(...args)
    firebaseError(...args)
  },
  warn: (...args: any[]) => {
    if (isVerbose.value()) console.warn(...args)
    firebaseWarn(...args)
  },
  info: (...args: any[]) => {
    if (isVerbose.value()) console.info(...args)
    firebaseInfo(...args)
  },
  debug: (...args: any[]) => {
    if (isVerbose.value()) console.debug(...args)
    firebaseDebug(...args)
  },
  print: (...args: any[]) => {
    if (isVerbose.value()) console.log(...args)
    friebaseLog(...args)
  },
  verbose: (...args: any[]) => {
    if (isVerbose.value()) {
      friebaseLog(...args)
      console.info(...args)
    }
  },
  time: (label?: string) => {
    isVerbose.value() && console.time(label)
  },
  timeLog: (label?: string) => {
    isVerbose.value() && console.timeLog(label)
  },
  timeEnd: (label?: string) => {
    isVerbose.value() && console.timeEnd(label)
  },
}

/**
 * The log service.
 * @param name - The name of the log service.
 * @param options - The options for the log service.
 */
export class LogService {
  name: string
  onError: (message: string, ...args: any[]) => void
  onWarn: (message: string, ...args: any[]) => void
  onInfo: (message: string, ...args: any[]) => void
  onDebug: (message: string, ...args: any[]) => void
  onLog: (message: string, ...args: any[]) => void
  onVerbose: (message: string, ...args: any[]) => void

  constructor(
    name: string,
    options: {
      onError: (message: string, ...args: any[]) => void
      onWarn: (message: string, ...args: any[]) => void
      onInfo: (message: string, ...args: any[]) => void
      onDebug: (message: string, ...args: any[]) => void
      onLog: (message: string, ...args: any[]) => void
      onVerbose: (message: string, ...args: any[]) => void
    },
  ) {
    this.name = name
    this.onError = options.onError
    this.onWarn = options.onWarn
    this.onInfo = options.onInfo
    this.onDebug = options.onDebug
    this.onLog = options.onLog
    this.onVerbose = options.onVerbose
  }

  prefix = (message?: string) => `[${this.name}] ${message}`

  // We apply the service name and color to the first argument to all of the
  // standard log functions if they're called from within a log service.
  print = (message?: string, ...args: any[]) => {
    this.onLog(this.prefix(message), ...args)
    log.print(this.prefix(message), ...args)
  }
  info = (message?: string, ...args: any[]) => {
    this.onInfo(this.prefix(message), ...args)
    log.info(this.prefix(message), ...args)
  }
  error = (message?: string, ...args: any[]) => {
    this.onError(this.prefix(message), ...args)
    log.error(this.prefix(message), ...args)
  }
  warn = (message?: string, ...args: any[]) => {
    this.onWarn(this.prefix(message), ...args)
    log.warn(this.prefix(message), ...args)
  }
  debug = (message?: string, ...args: any[]) => {
    this.onDebug(this.prefix(message), ...args)
    log.debug(this.prefix(message), ...args)
  }
  verbose = (message?: string, ...args: any[]) => {
    this.onVerbose(this.prefix(message), ...args)
    log.verbose(this.prefix(message), ...args)
  }

  time = (label?: string) => log.time(this.prefix(label))
  timeLog = (label?: string) => log.timeLog(this.prefix(label))
  timeEnd = (label?: string) => log.timeEnd(this.prefix(label))

  start = (...args: any[]) => {
    this.time('run')
    this.verbose('▶️ start', ...args)
  }

  end = (...args: any[]) => {
    this.timeEnd('run')
    this.verbose('⏹️ end', ...args)
  }

  // Returns an empty function that logs an error when called. Useful for
  // debugging when a function is called before it is initialized. For example:
  // in contexts as a default value for a function the context provides.
  calledBeforeInitialized = (functionName: string) => () => {
    const message = `Function ${functionName} was called before it was initialized`
    if (isVerbose.value()) this.error(message)
  }
}
