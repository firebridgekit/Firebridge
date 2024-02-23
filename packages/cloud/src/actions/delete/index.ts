import { getFirestore } from 'firebase-admin/firestore'

/**
 * Options for deleting a Firestore document.
 * @typedef {Object} FirestoreDeleteOptions
 * @property {boolean} [recursive=false] - If true, recursively deletes all documents and subcollections at and under the specified level.
 */
type FirestoreDeleteOptions = {
  recursive?: boolean
}

/**
 * @function firestoreDelete
 * @template Args - The type of the arguments object. Defaults to a record of string keys and any values if not provided.
 * @description A higher-order function that returns a function for deleting a Firestore document.
 * @param {string | ((args: Args) => string)} collectionPath - The path to the Firestore collection containing the document, or a function that returns the path. The function is passed the arguments object.
 * @param {FirestoreDeleteOptions} [options={}] - An object containing options for the delete operation. If not provided, defaults to an empty object.
 * @returns {(id: string, args?: Args) => Promise<DocumentReference>} - A function that deletes a Firestore document and returns a Promise that resolves with a DocumentReference to the deleted document. The function takes the ID of the document and an optional arguments object.
 */
export const firestoreDelete =
  <Args = Record<string, any>>(
    collectionPath: string | ((args: Args) => string),
    { recursive = false }: FirestoreDeleteOptions = {},
  ) =>
  /**
   * @param {string} id - The ID of the document to delete.
   * @param {Args} [args] - The arguments object.
   * @returns {Promise<DocumentReference>} - A Promise that resolves with a DocumentReference to the deleted document.
   */
  async (id: string, args?: Args) => {
    const ref = await getFirestore()
      .collection(
        typeof collectionPath === 'string'
          ? collectionPath
          : collectionPath({ ...(args as Args) }),
      )
      .doc(id)

    if (recursive) {
      await getFirestore().recursiveDelete(ref)
    } else {
      await ref.delete()
    }

    return ref
  }
