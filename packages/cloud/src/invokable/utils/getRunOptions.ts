import { RuntimeOptions } from 'firebase-functions'
import { config } from 'firebase-functions'

import { InvokableRuntimeModes } from '../type'

export const getRunOptions = (
  modes: InvokableRuntimeModes = {},
): RuntimeOptions => {
  // passing nothing to replace old options does not reset it.
  // E.g. if previously, `minInstances: 1` was passed in performance mode, a
  // subsequent normal mode deployment won't reset minInstances to zero
  // automatically unless an explicit zero is passed.
  const resets: RuntimeOptions = {
    minInstances: 0,
  }

  const mode = config().invokable.mode as keyof InvokableRuntimeModes

  return {
    ...resets,
    ...modes.default,
    ...(mode && modes[mode]),
  }
}
