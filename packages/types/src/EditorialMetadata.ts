import { FirestoreTimestamp } from './FirestoreTimestamp'

/**
 * @typedef Metadata
 * @description Represents the metadata of a Firestore document.
 * @property {string} [status] - The status of the document.
 * @property {FirestoreTimestamp} timeCreated - The time when the document was created.
 * @property {FirestoreTimestamp} [timeUpdated] - The time when the document was last updated.
 * @property {FirestoreTimestamp} [timeDeleted] - The time when the document was deleted.
 */
export type EditorialMetadata<TS = FirestoreTimestamp> = {
  status?: 'draft' | 'published' | 'archived' | 'deleted'
  timeCreated: TS
  timeUpdated?: TS
  timeDeleted?: TS
}

/**
 * @typedef WithEditorialMetadata
 * @template T - The type of the object.
 * @type {object}
 * @property {EditorialMetadata} _editorialMetadata - The metadata of the object.
 */
export type WithEditorialMetadata<T, TS = FirestoreTimestamp> = T & {
  _editorialMetadata: EditorialMetadata<TS>
}
