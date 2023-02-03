import { firestore } from 'firebase-admin'

export const firestoreExistsOrHasChildren =
  <A = Record<string, any>>(
    // The collection path to add the document to.
    // This can be a string or a function that returns a string based on the parts
    // passed into the action.
    // (see the advanced example in src/actions/add/index.ts)
    collectionPath: string | ((args: A) => string),
  ) =>
  async (id: string, args?: A) => {
    const ref = await firestore()
      .collection(
        typeof collectionPath === 'string'
          ? collectionPath
          : collectionPath({ ...(args as A) }),
      )
      .doc(id)
      .get()

    // check if the document exists
    if (ref.exists) return true

    // some document ids appear in italics on firestore. This means the document
    // does not actually exist but has sub collections. This happens when you
    // create sub collection to an empty document.

    // For such documents, doc.exists returns false.
    // https://stackoverflow.com/a/48069564/4380666

    // However, we want to make sure we identify such documents as well.
    // So if a document has subcollections, in our terminology, it exists as
    // well (as opposed to firestore which says it doesn't)

    const hasSubCollections = (await ref.ref.listCollections()).length > 0
    return hasSubCollections
  }
