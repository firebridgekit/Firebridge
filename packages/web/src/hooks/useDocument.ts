import { DocumentReference } from 'firebase/firestore'
import { useDocument as useFirebaseHooksDocument } from 'react-firebase-hooks/firestore'
import { useFirebridge } from '../contexts'
import { WithId } from '../types'

// Use Document
// ------------
// Returns a realtime Document from Firestore when the user is logged in with
// path parts that can be undefined. This is useful in situations where the path
// parts are not known at the time of the hook call.
//
// Example:
// Some data that may be undefined at runtime:
// const { params } = useRouter()
// const { topicId } = params
//
// The document path which is dependent on the topicId:
// const posts = useFirebridgeDoc((_uid, topic) =>
//   doc(firestore, 'topics', topic),
//   [topicId]
// )
//
// A document path which is dependent on a uid:
// const posts = useFirebridgeDoc((uid) => doc(firestore, 'profiles', uid))

export const useDocument = <T = any>(
  getRef:
    | DocumentReference
    | ((uid: string, ...pathParts: string[]) => DocumentReference)
    | undefined,
  pathParts: (string | undefined)[] = [],
) => {
  const { user } = useFirebridge()
  const uid = user?.uid

  // If the user is not logged in, we don't attempt to fetch the collection.
  // This is because Firebridge assumes all collections are private.
  if (!uid) {
    return undefined
  }

  // If any of the path parts are undefined, we don't attempt to fetch the
  // collection. This is because we don't know what the path should be.
  if (pathParts.includes(undefined)) {
    return undefined
  }

  const ref =
    typeof getRef === 'function'
      ? getRef(uid, ...(pathParts as string[]))
      : getRef

  const [doc] = useFirebaseHooksDocument(ref)

  // react-firebase-hooks will return undefined if the query is not ready.
  // We want to preserve that behavior so that we can show a loading state.
  if (doc === undefined) return undefined

  // If the query is ready, but the document does not exist, we want to return
  // null so that we can show a "not found" state.
  const data = { ...doc.data(), id: doc.id } as WithId<T>
  return doc.exists() ? data : null
}
