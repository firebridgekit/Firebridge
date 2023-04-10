import { firestore } from 'firebase-admin'

// sort a list of firestore timestamps
export const sortTimestamps = (
  a: firestore.Timestamp | undefined | null,
  b: firestore.Timestamp | undefined | null,
) => {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  if (a.toMillis() > b.toMillis()) return 1
  if (a.toMillis() < b.toMillis()) return -1
  return 0
}

export type PossiblyMissing<T> = T | undefined | null

// get the earliest timestamp
export const minTimestamp = (
  timestamps: PossiblyMissing<firestore.Timestamp>[],
) => timestamps.sort(sortTimestamps)[0]

export const maxTimestamp = (
  timestamps: PossiblyMissing<firestore.Timestamp>[],
) => {
  // remove nulls and undefineds
  const pureTimestamps = timestamps.flatMap((t) => (t ? [t] : []))
  // return the latest timestamp
  return pureTimestamps.sort(sortTimestamps)[pureTimestamps.length - 1]
}
