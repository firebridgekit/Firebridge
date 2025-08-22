import { getFirestore } from 'firebase-admin/firestore'

import { readQuerySnapshot } from '../../snapshots'

export const firestoreGetDocs =
  <Data, Args = Record<string, any>>(
    collectionPath: string | ((args: Args) => string),
  ) =>
  async (args?: Args) => {
    const docs = await getFirestore()
      .collection(
        typeof collectionPath === 'string'
          ? collectionPath
          : collectionPath(args as Args),
      )
      .get()

    return readQuerySnapshot<Data>(docs)
  }
