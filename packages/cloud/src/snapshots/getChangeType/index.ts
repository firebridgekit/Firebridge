import { DocumentSnapshot } from 'firebase-admin/firestore'

/**
 * @typedef DocumentChangeType
 * @description Represents the type of change that occurred on a Firestore document.
 * @type {'create' | 'update' | 'delete'}
 */
type DocumentChangeType = 'create' | 'update' | 'delete'

/**
 * @function getChangeType
 * @description Determines the type of change that occurred on a Firestore document.
 * @param {Object} change - The change object containing the before and after snapshots of a Firestore document.
 * @param {DocumentSnapshot} change.before - The snapshot of the document before the change.
 * @param {DocumentSnapshot} change.after - The snapshot of the document after the change.
 * @returns {DocumentChangeType} - The type of change that occurred on the document.
 */
export const getChangeType = (change: {
  before: DocumentSnapshot
  after: DocumentSnapshot
}): DocumentChangeType => {
  if (!change.after.exists) return 'delete'
  if (!change.before.exists) return 'create'
  return 'update'
}
