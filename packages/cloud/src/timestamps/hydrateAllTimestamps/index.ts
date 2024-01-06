import { Timestamp } from 'firebase-admin/firestore'

import { hydrateTimestamp } from '../hydrateTimestamp'

type HydratedObject<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? Timestamp : T[P]
}

/**
 * @function hydrateAllTimestamps
 * @description A function that converts all serialized Firestore timestamps in an object back into Firestore Timestamp objects.
 * @param {Record<string, SerializedFirestoreTimestamp>} data - The object containing the serialized Firestore timestamps to convert.
 * @returns {Record<string, Timestamp>} - The object with all serialized Firestore timestamps converted to Firestore Timestamp objects.
 * @throws {Error} - Throws an error if any serialized timestamp is invalid.
 */
export const hydrateAllTimestamps = <
  T extends Record<string, any>,
  K extends keyof T,
>(
  obj: T,
  keys: K[],
): HydratedObject<T, K> => {
  const hydrated: any = { ...obj }
  keys.forEach(key => {
    const value = obj[key]
    if (value) hydrated[key] = hydrateTimestamp(value)
  })
  return hydrated
}
