import { getFirestore } from 'firebase-admin/firestore'

import { readSnapshot } from '../../snapshots'

/**
 * @function firestoreGet
 * @template Data - The type of the document data.
 * @template Args - The type of the arguments object. Defaults to a record of string keys and any values if not provided.
 * @description A higher-order function that returns a function for getting a Firestore document.
 * @param {string | ((args: Args) => string)} collectionPath - The path to the Firestore collection containing the document, or a function that returns the path. The function is passed the arguments object.
 * @returns {(id: string, args?: Args) => Promise<Data | null>} - A function that gets a Firestore document and returns a Promise that resolves with the document data or null if the document does not exist. The function takes the ID of the document and an optional arguments object.
 */
export const firestoreGet =
  <Data, Args = Record<string, any>>(
    collectionPath: string | ((args: Args) => string),
  ) =>
  /**
   * @param {string} id - The ID of the document to get.
   * @param {Args} [args] - The arguments object.
   * @returns {Promise<WithId<Data> | undefined>} - A Promise that resolves with the document data or undefined if the document does not exist.
   */
  async (id: string, args?: Args) => {
    const doc = await getFirestore()
      .collection(
        typeof collectionPath === 'string'
          ? collectionPath
          : collectionPath({ ...(args as Args) }),
      )
      .doc(id)
      .get()

    return doc.exists ? readSnapshot<Data>(doc) : undefined
  }
