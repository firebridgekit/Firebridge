import { firestore } from 'firebase-admin'

import { SerializedFirestoreTimestamp } from '../type'
import { Timestamp } from 'firebase-admin/firestore'

export const timestampToDate = (timestamp?: SerializedFirestoreTimestamp) => {
  const seconds = timestamp?.seconds ?? timestamp?._seconds
  if (!seconds) throw new Error('Invalid timestamp')
  return new Date(seconds * 1000)
}

export const hydrateTimestamp = (timestamp?: SerializedFirestoreTimestamp) => {
  const seconds = timestamp?.seconds ?? timestamp?._seconds
  if (!seconds) throw new Error('Invalid timestamp')
  return firestore.Timestamp.fromMillis(seconds * 1000)
}

type HydratedObject<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? Timestamp : T[P]
}

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
