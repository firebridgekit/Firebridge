import { App } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

/**
 * Options for creating a Firestore document.
 * @typedef {Object} FirestoreCreateOptions
 * @property {boolean} [addMetadata=false] - If true, automatically adds metadata to the document.
 * @property {App} [app] - The Firebase app to use for the Firestore instance.
 */
type FirestoreCreateOptions = {
  addMetadata?: boolean
  app?: App
}

/**
 * @function firestoreAdd
 * @template Data - The type of the document data.
 * @template Args - The type of the arguments object. Defaults to a record of string keys and any values if not provided.
 * @description A higher-order function that returns a function for adding a Firestore document.
 * @param {string | ((args: Args & { data: Data }) => string)} collectionPath - The path to the Firestore collection where the document will be added, or a function that returns the path. The function is passed an object containing the arguments and the document data.
 * @param {FirestoreCreateOptions} [options={}] - An object containing options for the add operation. If not provided, defaults to an empty object.
 * @returns {(item: Data, args?: Args) => Promise<DocumentReference>} - A function that adds a Firestore document and returns a Promise that resolves with a DocumentReference to the added document. The function takes the document data and an optional arguments object.
 */
export const firestoreAdd =
  <Data, Args = Record<string, any>>(
    collectionPath: string | ((args: Args & { data: Data }) => string),
    { addMetadata, app }: FirestoreCreateOptions = {},
  ) =>
  /**
   * @param {Data} item - The document data.
   * @param {Args} [args] - The arguments object.
   * @returns {Promise<firebase.DocumentReference>} - A Promise that resolves with a DocumentReference to the newly created document.
   */
  async (item: Data, args?: Args) => {
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
      .add(data)

    return ref
  }
