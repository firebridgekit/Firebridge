import { firestore } from 'firebase-admin'

import { PossiblyMissing } from '../../type'
import { sortTimestamps } from '../sortTimestamps'

/**
 * @function minTimestamp
 * @description A function that returns the earliest timestamp from an array of Firestore timestamps.
 * @param {PossiblyMissing<firestore.Timestamp>[]} timestamps - An array of timestamps.
 * @returns {firestore.Timestamp | undefined} - Returns the earliest timestamp, or undefined if the array is empty.
 */
export const minTimestamp = (
  timestamps: PossiblyMissing<firestore.Timestamp>[],
) => timestamps.sort(sortTimestamps)[0]
