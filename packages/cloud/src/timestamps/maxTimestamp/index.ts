import { firestore } from 'firebase-admin'

import { PossiblyMissing } from '../../type'
import { sortTimestamps } from '../sortTimestamps'

/**
 * @function maxTimestamp
 * @description A function that returns the latest timestamp from an array of Firestore timestamps.
 * @param {PossiblyMissing<firestore.Timestamp>[]} timestamps - An array of timestamps.
 * @returns {firestore.Timestamp | undefined} - Returns the latest timestamp, or undefined if the array is empty or only contains missing values.
 */
export const maxTimestamp = (
  timestamps: PossiblyMissing<firestore.Timestamp>[],
) => {
  // remove nulls and undefineds
  const pureTimestamps = timestamps.flatMap(t => (t ? [t] : []))
  // return the latest timestamp
  return pureTimestamps.sort(sortTimestamps)[pureTimestamps.length - 1]
}
