import { firestore } from 'firebase-admin'
import { chunk } from 'lodash'

export interface FirestoreOperation {
  type: keyof firestore.WriteBatch
  ref: FirebaseFirestore.DocumentReference
  data?: any
}

export const executeFirestoreBatch = async (batch: FirestoreOperation[]) => {
  const chunks = chunk(batch, 500)
  for (const chunk of chunks) {
    const batch = firestore().batch()
    chunk.forEach(({ type, ref, data }) => {
      switch (type) {
        case 'set':
          return batch[type as 'set'](ref, data)
        case 'update':
          return batch[type as 'update'](ref, data)
        default:
          throw new Error(`Unknown batch operation type: ${type}`)
      }
    })
    await batch.commit()
  }
}

export const executeFirestoreParallel = async (
  operations: FirestoreOperation[],
) =>
  Promise.all([
    ...operations.map(async ({ type, ref, data }) => {
      switch (type) {
        case 'set':
          return ref.set(data)
        case 'update':
          return ref.update(data)
        default:
          throw new Error(`Unknown batch operation type: ${type}`)
      }
    }),
  ])
