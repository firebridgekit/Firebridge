import { getFirestore, Timestamp } from 'firebase-admin/firestore'

/**
 * Options for merging a Firestore document.
 * @typedef {Object} FirestoreMergeOptions
 * @property {boolean} [addMetadata=false] - If true, adds metadata to the document.
 */
type FirestoreMergeOptions = {
  addMetadata?: boolean
}

/**
 * @function firestoreMerge
 * @template Data - The type of the document data.
 * @template Args - The type of the arguments object. Defaults to a record of string keys and any values if not provided.
 * @description A higher-order function that returns a function for merging data into a Firestore document.
 * @param {string | ((args: Args & { data: Data }) => string)} collectionPath - The path to the Firestore collection containing the document, or a function that returns the path. The function is passed an object containing the arguments and the document data.
 * @param {FirestoreMergeOptions} [options={}] - An object containing options for the merge operation. If not provided, defaults to an empty object.
 * @returns {(id: string, data: Data, args?: Args) => Promise<DocumentReference>} - A function that merges data into a Firestore document and returns a Promise that resolves with a DocumentReference to the merged document. The function takes the ID of the document, the data to merge into the document, and an optional arguments object.
 */
export const firestoreMerge =
  <Data, Args = Record<string, any>>(
    collectionPath: string | ((args: Args & { data: Partial<Data> }) => string),
    { addMetadata }: FirestoreMergeOptions = {},
  ) =>
  /**
   * @param {string} id - The ID of the document to merge.
   * @param {Partial<Data>} item - The item to merge in the document.
   * @param {Args} [args] - The arguments object.
   * @returns {Promise<DocumentReference>} - A Promise that resolves with a DocumentReference to the merged document.
   */
  async (id: string, item: Partial<Data>, args?: Args) => {
    const data = {
      ...item,
      ...(addMetadata && {
        'metadata.timeUpdated': Timestamp.now(),
      }),
    }

    const ref = await getFirestore()
      .collection(
        typeof collectionPath === 'string'
          ? collectionPath
          : collectionPath({ ...(args as Args), data }),
      )
      .doc(id)
      .set(data, { merge: true })

    return ref
  }
