export type FirestoreTimestamp = {
  seconds: number
  nanoseconds: number
}

export type SerializedFirestoreTimestamp = {
  seconds?: number
  nanoseconds?: number
  _seconds?: number
  _nanoseconds?: number
}
