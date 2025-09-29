import { App } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { WithFieldValues } from '../../types'

/**
 * Options for setting a Firestore document.
 * @typedef {Object} FirestoreSetOptions
 * @property {boolean} [addMetadata=false] - If true, adds metadata to the document.
 */
type FirestoreSetOptions = {
  addMetadata?: boolean
  app?: App
}

/**
 * @function firestoreSet
 * @template Data - The type of the document data.
 * @template Args - The type of the arguments object. Defaults to a record of string keys and any values if not provided.
 * @description A higher-order function that returns a function for setting a Firestore document.
 * @param {string | ((args: Args & { data: Data }) => string)} collectionPath - The path to the Firestore collection containing the document, or a function that returns the path. The function is passed an object containing the arguments and the document data.
 * @param {FirestoreSetOptions} [options={}] - An object containing options for the set operation. If not provided, defaults to an empty object.
 * @returns {(id: string, data: Data, args?: Args) => Promise<DocumentReference>} - A function that sets a Firestore document and returns a Promise that resolves with a DocumentReference to the set document. The function takes the ID of the document, the data to set on the document, and an optional arguments object.
 */
export const firestoreSet =
  <Data, Args = Record<string, any>>(
    collectionPath: string | ((args: Args & { data: Data }) => string),
    { addMetadata, app }: FirestoreSetOptions = {},
  ) =>
  /**
   * @param {string} id - The ID of the document to set.
   * @param {Data} item - The item to set in the document.
   * @param {Args} [args] - The arguments object.
   * @returns {Promise<DocumentReference>} - A Promise that resolves with a DocumentReference to the set document.
   */
  async (id: string, item: WithFieldValues<Data>, args?: Args) => {
    const data = {
      ...item,
      ...(addMetadata && {
        'metadata.timeCreated': Timestamp.now(),
        'metadata.timeUpdated': Timestamp.now(),
      }),
    }

    // Get the Firestore instance for the given app, or the default instance
    // if no app is provided.
    const firestore = app ? getFirestore(app) : getFirestore()

    const ref = await firestore
      .collection(
        typeof collectionPath === 'string'
          ? collectionPath
          : collectionPath({ ...(args as Args), data }),
      )
      .doc(id)
      .set(data)

    return ref
  }
