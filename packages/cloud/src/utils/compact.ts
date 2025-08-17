/**
 * Removes undefined values from an array.
 * @param array - The array to compact.
 * @returns The compacted array.
 */
export const compact = <T>(array: T[]) => array.flatMap(i => (i ? [i] : []))

/**
 * Removes undefined values from an object.
 * @param obj - The object to compact.
 * @returns The compacted object.
 */
export const compactObject = <T extends Record<string, any>>(obj: T) =>
  Object.entries(obj).reduce((acc, [key, value]) => {
    if (typeof value !== 'undefined') {
      ;(acc as any)[key] = value
    }
    return acc
  }, {} as T)
