import { firestore } from 'firebase-admin'

interface FirstoreMergeOptions {
  addMetadata?: boolean
}

export const firestoreMerge =
  <T, A = Record<string, any>>(
    // The collection path to add the document to.
    // This can be a string or a function that returns a string based on the parts
    // passed into the action.
    // (see the advanced example in src/actions/add/index.ts)
    collectionPath: string | ((args: A & { data: Partial<T> }) => string),
    { addMetadata }: FirstoreMergeOptions = {},
  ) =>
  async (id: string, item: Partial<T>, args?: A) => {
    try {
      const data = {
        ...item,
        ...(addMetadata && {
          'metadata.timeUpdated': firestore.Timestamp.now(),
        }),
      }

      const ref = await firestore()
        .collection(
          typeof collectionPath === 'string'
            ? collectionPath
            : collectionPath({ ...(args as A), data }),
        )
        .doc(id)
        .set(data, { merge: true })

      return ref
    } catch (error) {
      throw error
    }
  }
