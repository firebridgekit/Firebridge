import { firestore } from 'firebase-admin'

export type WithId<T> = T & { id: string }

export interface Metadata {
  // Tracks when the document was created and by whom.
  createdBy?: string
  timeCreated: firestore.Timestamp

  // Tracks when the document was updated and by whom.
  updatedBy?: string
  timeUpdated?: firestore.Timestamp
}

export type WithMetadata<T> = T & Metadata

export type SerializedFirestoreTimestamp = {
  nanoseconds?: number
  seconds?: number
  _nanoseconds?: number
  _seconds?: number
}
