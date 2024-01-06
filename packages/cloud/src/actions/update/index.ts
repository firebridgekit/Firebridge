import { firestore } from 'firebase-admin'

/**
 * Options for updating a Firestore document.
 * @typedef {Object} FirestoreUpdateOptions
 * @property {boolean} [addMetadata=false] - If true, adds metadata to the document.
 */
type FirestoreUpdateOptions = {
  addMetadata?: boolean
}

/**
 * @function firestoreUpdate
 * @template Data - The type of the document data.
 * @template Args - The type of the arguments object. Defaults to a record of string keys and any values if not provided.
 * @description A higher-order function that returns a function for updating a Firestore document.
 * @param {string | ((args: Args & { data: Partial<Data> }) => string)} collectionPath - The path to the Firestore collection containing the document, or a function that returns the path. The function is passed an object containing the arguments and the document data.
 * @param {FirestoreUpdateOptions} [options={}] - An object containing options for the update operation. If not provided, defaults to an empty object.
 * @returns {(id: string, updates: Partial<Data>, args?: Args) => Promise<firestore.DocumentReference>} - A function that updates a Firestore document and returns a Promise that resolves with a DocumentReference to the updated document. The function takes the ID of the document, the updates to apply to the document, and an optional arguments object.
 */
export const firestoreUpdate =
  <Data, Args = Record<string, any>>(
    collectionPath: string | ((args: Args & { data: Partial<Data> }) => string),
    { addMetadata }: FirestoreUpdateOptions = {},
  ) =>
  /**
   * @param {string} id - The ID of the document to update.
   * @param {Partial<Data>} updates - The updates to apply to the document.
   * @param {Args} [args] - The arguments object.
   * @returns {Promise<firebase.firestore.DocumentReference>} - A Promise that resolves with a DocumentReference to the updated document.
   */
  async (id: string, updates: Partial<Data>, args?: Args) => {
    const data = {
      ...updates,
      ...(addMetadata && {
        'metadata.timeUpdated': firestore.Timestamp.now(),
      }),
    }

    const ref = await firestore()
      .collection(
        typeof collectionPath === 'string'
          ? collectionPath
          : collectionPath({ ...(args as Args), data }),
      )
      .doc(id)
      .update(data)

    return ref
  }
