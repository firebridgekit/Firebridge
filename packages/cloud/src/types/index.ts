import {
  EditorialMetadata as PlatformEditorialMetadata,
  WithEditorialMetadata as PlatformWithEditorialMetadata,
  WithId,
  PlatformError,
  PossiblyMissing,
  SerializedFirestoreTimestamp,
  UserPermissions,
} from '@repo/types'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

export type EditorialMetadata = PlatformEditorialMetadata<Timestamp>
export type WithEditorialMetadata<T> = PlatformWithEditorialMetadata<
  T,
  Timestamp
>

// Allow for any field to be a Firebase FieldValue
export type WithFieldValues<T> = T & {
  [K in keyof T]: T[K] | FieldValue
}

export type {
  WithId,
  PlatformError,
  PossiblyMissing,
  SerializedFirestoreTimestamp,
  UserPermissions,
}
