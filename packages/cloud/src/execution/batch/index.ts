import { getFirestore } from 'firebase-admin/firestore'

import { chunk } from '../../utils/chunk'
import { FirestoreOperation } from '../type'

/**
 * @function executeFirestoreBatch
 * @description A function that executes multiple Firestore operations in a batch. This function is useful when you need to perform multiple operations on different documents and want to ensure that they all succeed or fail together.
 * @param {FirestoreOperation[]} operations - An array of FirestoreOperation objects representing the operations to perform.
 * @returns {Promise<void>} - A Promise that resolves when all operations have been committed. If any operation fails, the Promise is rejected with the error from the failed operation.
 */
export const executeFirestoreBatch = async (
  operations: FirestoreOperation[],
  chunkSize = 500,
) => {
  // Split the batch into chunks of 500 operations each, as this is the limit for Firestore batch writes.
  const chunks = chunk(operations, chunkSize)

  // Process each chunk of operations.
  for (const operationsChunk of chunks) {
    // Start a new batch operation.
    const batch = getFirestore().batch()

    // Add each operation in the chunk to the batch.
    operationsChunk.forEach(({ type, ref, data }) => {
      switch (type) {
        case 'set':
          // Perform a 'set' operation.
          return batch.set(ref, data)
        case 'merge':
          // Perform a 'merge' operation (similar to 'set', but merges with existing data).
          return batch.set(ref, data, { merge: true })
        case 'update':
          // Perform an 'update' operation.
          return batch.update(ref, data)
        default:
          // Handle unknown operation types.
          throw new Error(`Unknown batch operation type: ${type}`)
      }
    })

    // Commit the batch of operations.
    await batch.commit()
  }
}
