import {
  EditorialMetadata as PlatformEditorialMetadata,
  WithEditorialMetadata as PlatformWithEditorialMetadata,
  WithId,
  PlatformError,
  PossiblyMissing,
  SerializedFirestoreTimestamp,
  UserPermissions,
} from '@repo/types'
import { Timestamp } from 'firebase-admin/firestore'

export type EditorialMetadata = PlatformEditorialMetadata<Timestamp>
export type WithEditorialMetadata<T> = PlatformWithEditorialMetadata<
  T,
  Timestamp
>

export type {
  WithId,
  PlatformError,
  PossiblyMissing,
  SerializedFirestoreTimestamp,
  UserPermissions,
}
