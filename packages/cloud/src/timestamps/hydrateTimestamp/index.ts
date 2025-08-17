import { Timestamp } from 'firebase-admin/firestore'

import { SerializedFirestoreTimestamp } from '../../types'

/**
 * @function hydrateTimestamp
 * @description A function that converts a serialized Firestore timestamp back into a Firestore Timestamp object.
 * @param {SerializedFirestoreTimestamp} [timestamp] - The serialized Firestore timestamp to convert. If not provided, the function will throw an error.
 * @returns {Timestamp} - The Firestore Timestamp object.
 * @throws {Error} - Throws an error if the serialized timestamp is invalid or not provided.
 */
export const hydrateTimestamp = (timestamp?: SerializedFirestoreTimestamp) => {
  const seconds = timestamp?.seconds ?? timestamp?._seconds
  if (!seconds) throw new Error('Invalid timestamp')
  return Timestamp.fromMillis(seconds * 1000)
}
