import { RuntimeOptions } from 'firebase-functions'
import { defineString } from 'firebase-functions/params'

import { InvokableRuntimeModes } from '../type'

const invokableMode = defineString('INVOKABLE_MODE')

/**
 * @function getRunOptions
 * @description A function to get the runtime options for a Firebase function.
 * @param {InvokableRuntimeModes} [modes={}] - An object representing the runtime modes. Each key is a mode name and the value is a RuntimeOptions object for that mode. Defaults to an empty object if not provided.
 * @returns {RuntimeOptions} - The runtime options for the Firebase function. If a mode is specified in the Firebase config, the function will return the options for that mode. If no mode is specified, the function will return the default options. If a mode is specified but no options are provided for that mode, the function will return the default options.
 */
const getRunOptions = (modes: InvokableRuntimeModes = {}): RuntimeOptions => {
  // passing nothing to replace old options does not reset it.
  // E.g. if previously, `minInstances: 1` was passed in performance mode, a
  // subsequent normal mode deployment won't reset minInstances to zero
  // automatically unless an explicit zero is passed.
  const resets: RuntimeOptions = {
    minInstances: 0,
  }

  const mode = invokableMode as unknown as keyof InvokableRuntimeModes

  return {
    ...resets,
    ...modes.default,
    ...(mode && modes[mode]),
  }
}

export default getRunOptions
