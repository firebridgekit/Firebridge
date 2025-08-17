import { QuerySnapshot } from 'firebase-admin/firestore'

import { WithId } from '../../types'
import { readSnapshot } from '../readSnapshot'

/**
 * @function readQuerySnapshot
 * @description A function that reads a Firestore query snapshot and returns an array of documents. Each document is represented as an object containing its data and ID. Documents that do not exist are excluded from the array.
 * @template T - The type of the document data. Defaults to any if not provided.
 * @param {QuerySnapshot} snap - The query snapshot to read.
 * @returns {WithId<T>[]} - An array of objects, each containing the data and ID of a document.
 */
export const readQuerySnapshot = <T = any>(snap: QuerySnapshot) =>
  snap.docs
    .map(doc => readSnapshot<T>(doc))
    .filter(doc => doc !== undefined) as WithId<T>[]
