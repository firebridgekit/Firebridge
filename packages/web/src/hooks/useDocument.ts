import { DocumentReference } from 'firebase/firestore'
import { useMemo } from 'react'
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
  const { user, log } = useFirebridge()
  const uid = user?.uid

  const ref = useMemo<DocumentReference | undefined>(() => {
    if (!uid) {
      // If the user is not logged in, we don't attempt to fetch the collection.
      // This is because Firebridge assumes all collections are private.
      return undefined
    } else if (pathParts.includes(undefined)) {
      // If any of the path parts are undefined, we don't attempt to fetch the
      // collection. This is because we don't know what the path should be.
      return undefined
    } else {
      return typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef
    }
  }, [getRef, pathParts, uid])

  const [doc, _loading, error] = useFirebaseHooksDocument(ref)

  const value = useMemo(() => {
    // If there is an error, we want to log it and return undefined so that we
    // can clear the current value.
    if (error) {
      log.error(error)
      return undefined
    }

    // react-firebase-hooks will return undefined if the query is not ready.
    // We want to preserve that behavior so that we can show a loading state.
    if (doc === undefined) return undefined

    // If the query is ready, but the document does not exist, we want to return
    // null so that we can show a "not found" state.
    const data = { ...doc.data(), id: doc.id } as WithId<T>
    return doc.exists() ? data : null
  }, [doc, error])

  return value
}
