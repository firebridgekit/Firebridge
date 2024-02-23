import { Timestamp } from 'firebase-admin/firestore'

/**
 * @typedef WithId
 * @template T - The type of the object.
 * @type {object}
 * @property {string} id - The ID of the object.
 */
export type WithId<T> = T & { id: string }

/**
 * @typedef Metadata
 * @description Represents the metadata of a Firestore document.
 * @property {string} [createdBy] - The ID of the user who created the document.
 * @property {Timestamp} timeCreated - The time when the document was created.
 * @property {string} [updatedBy] - The ID of the user who last updated the document.
 * @property {Timestamp} [timeUpdated] - The time when the document was last updated.
 */
export type Metadata = {
  // Tracks when the document was created and by whom.
  createdBy?: string
  timeCreated: Timestamp

  // Tracks when the document was updated and by whom.
  updatedBy?: string
  timeUpdated?: Timestamp
}

/**
 * @typedef WithMetadata
 * @template T - The type of the object.
 * @type {object}
 * @property {Metadata} Metadata - The metadata of the object.
 */
export type WithMetadata<T> = T & Metadata

/**
 * @typedef SerializedFirestoreTimestamp
 * @description Represents a Firestore timestamp that has been serialized to JSON.
 * @property {number} [nanoseconds] - The number of nanoseconds since the last second.
 * @property {number} [seconds] - The number of seconds since the Unix epoch.
 * @property {number} [_nanoseconds] - The number of nanoseconds since the last second (used by some Firestore SDKs).
 * @property {number} [_seconds] - The number of seconds since the Unix epoch (used by some Firestore SDKs).
 */
export type SerializedFirestoreTimestamp = {
  nanoseconds?: number
  seconds?: number
  _nanoseconds?: number
  _seconds?: number
}

/**
 * @typedef PossiblyMissing
 * @template T - The type of the value.
 * @description Represents a value that may be missing (i.e., undefined or null).
 */
export type PossiblyMissing<T> = T | undefined | null
