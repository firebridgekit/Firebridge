import { SerializedFirestoreTimestamp } from '../../types'

/**
 * @function timestampToDate
 * @description A function that converts a serialized Firestore timestamp into a JavaScript Date object.
 * @param {SerializedFirestoreTimestamp} [timestamp] - The serialized Firestore timestamp to convert. If not provided, the function will throw an error.
 * @returns {Date} - The JavaScript Date object.
 * @throws {Error} - Throws an error if the serialized timestamp is invalid or not provided.
 */
export const timestampToDate = (timestamp?: SerializedFirestoreTimestamp) => {
  const seconds = timestamp?.seconds ?? timestamp?._seconds
  if (!seconds) throw new Error('Invalid timestamp')
  return new Date(seconds * 1000)
}
