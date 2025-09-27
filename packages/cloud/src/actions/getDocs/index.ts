import { App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

import { readQuerySnapshot } from '../../snapshots'

/**
 * Options for getting Firestore documents.
 * @typedef {Object} FirestoreGetDocsOptions
 * @property {App} [app] - The Firebase app to use for the Firestore instance.
 */
type FirestoreGetDocsOptions = {
  app?: App
}

export const firestoreGetDocs =
  <Data, Args = Record<string, any>>(
    collectionPath: string | ((args: Args) => string),
    { app }: FirestoreGetDocsOptions = {},
  ) =>
  async (args?: Args) => {
    // Get the Firestore instance for the given app, or the default instance
    // if no app is provided.
    const firestore = app ? getFirestore(app) : getFirestore()

    const docs = await firestore
      .collection(
        typeof collectionPath === 'string'
          ? collectionPath
          : collectionPath(args as Args),
      )
      .get()

    return readQuerySnapshot<Data>(docs)
  }
