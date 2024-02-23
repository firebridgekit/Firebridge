import { Timestamp } from 'firebase-admin/firestore'

import { PossiblyMissing } from '../../type'

/**
 * @function sortTimestamps
 * @description A function that sorts two Firestore timestamps.
 * @param {PossiblyMissing<Timestamp>} a - The first timestamp.
 * @param {PossiblyMissing<Timestamp>} b - The second timestamp.
 * @returns {number} - Returns 1 if the first timestamp is later than the second, -1 if the first timestamp is earlier than the second, and 0 if they are equal or both missing.
 */
export const sortTimestamps = (
  a: PossiblyMissing<Timestamp>,
  b: PossiblyMissing<Timestamp>,
) => {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  if (a.toMillis() > b.toMillis()) return 1
  if (a.toMillis() < b.toMillis()) return -1
  return 0
}
