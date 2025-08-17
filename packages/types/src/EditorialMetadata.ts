import { FirestoreTimestamp } from './FirestoreTimestamp'

/**
 * @typedef Metadata
 * @description Represents the metadata of a Firestore document.
 * @property {FirestoreTimestamp} timeCreated - The time when the document was created.
 * @property {FirestoreTimestamp} [timeUpdated] - The time when the document was last updated.
 */
export type EditorialMetadata<TS = FirestoreTimestamp> = {
  timeCreated: TS
  timeUpdated?: TS
}

/**
 * @typedef WithEditorialMetadata
 * @template T - The type of the object.
 * @type {object}
 * @property {EditorialMetadata} metadata - The metadata of the object.
 */
export type WithEditorialMetadata<T, TS = FirestoreTimestamp> = T & {
  metadata: EditorialMetadata<TS>
}
