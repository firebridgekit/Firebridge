import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

export type WithId<T> = T & { id: string }

export type WithNativeTimestamps<T, Keys extends keyof T> = Omit<T, Keys> & {
  [K in Keys]: FirebaseFirestoreTypes.Timestamp
}
