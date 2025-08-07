import { Timestamp } from 'firebase-admin/firestore'

declare global {
  function createMockTimestamp(date: string | Date): Timestamp

  function createMockEvent(
    time: string | Date,
    count?: number,
    value?: number,
  ): {
    time: Timestamp
    count: number
    value: number
  }
}

export {}
