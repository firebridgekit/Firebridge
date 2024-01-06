import chunk from '../../utils/chunk'
import { FirestoreOperation } from '../type'

/**
 * @function executeFirestoreParallel
 * @description A function that executes multiple Firestore operations in parallel. This function is useful when you need to perform multiple operations on different documents at the same time.
 * @param {FirestoreOperation[]} operations - An array of FirestoreOperation objects representing the operations to perform.
 * @returns {Promise<void>} - A Promise that resolves when all operations have completed. If any operation fails, the Promise is rejected with the error from the failed operation.
 */
export const executeFirestoreParallel = async (
  operations: FirestoreOperation[],
  chunkSize = 25,
) => {
  // Split the batch into smaller chunks of operations so we don't overload the Firestore API.
  const chunks = chunk(operations, chunkSize)

  // Process each chunk of operations.
  for (const operationsChunk of chunks) {
    // Start a new batch operation.

    await Promise.all([
      // Mapping over each operation and executing the corresponding Firestore command based on the operation type.
      ...operationsChunk.map(async ({ type, ref, data }) => {
        switch (type) {
          case 'set':
            // Perform a 'set' operation on the provided document reference with the given data.
            return ref.set(data)
          case 'merge':
            // Perform a 'merge' operation, which is similar to 'set', but it merges the provided data with the existing document data.
            return ref.set(data, { merge: true })
          case 'update':
            // Perform an 'update' operation to update the document with the provided data.
            return ref.update(data)
          default:
            // Handling unknown operation types to prevent unexpected behavior.
            throw new Error(`Unknown batch operation type: ${type}`)
        }
      }),
    ])
  }
}
