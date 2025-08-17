import { DocumentSnapshot } from 'firebase-admin/firestore'

import { WithId } from '../../types'

/**
 * @function readSnapshot
 * @description A function that reads a Firestore document snapshot and returns its data along with its ID. If the document does not exist, the function returns undefined.
 * @template T - The type of the document data. Defaults to any if not provided.
 * @param {DocumentSnapshot} doc - The document snapshot to read.
 * @returns {WithId<T> | undefined} - An object containing the document data and ID, or undefined if the document does not exist.
 */
export const readSnapshot = <T = any>(doc: DocumentSnapshot) =>
  (typeof doc.exists === 'function' && doc.exists) || doc.exists
    ? ({ ...doc?.data(), id: doc.id } as WithId<T>)
    : undefined
