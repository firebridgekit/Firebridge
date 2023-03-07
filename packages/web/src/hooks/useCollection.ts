import { CollectionReference, Query } from 'firebase/firestore'
import { useMemo } from 'react'
import { useCollection as useFirebaseHooksCollection } from 'react-firebase-hooks/firestore'

import { useFirebridge } from '../contexts'
import { WithId } from '../types'

// Use Collection
// --------------
// Returns a realtime collection from Firestore when the user is logged in with
// path parts that can be undefined. This is useful in situations where the path
// parts are not known at the time of the hook call.

// Example:
// Some data that may be undefined at runtime:
// const { params } = useRouter()
// const { topicId } = params
//
// The collection path which is dependent on the topicId:
// const posts = useFirebridgeCollection((_uid, topic) =>
//   collection(firestore, 'topics', topic, 'posts'),
//   [topicId]
// )
//
// A collection path which is dependent on a uid:
// const posts = useFirebridgeDoc((uid) =>
//   collection(firestore, 'profiles', uid, 'connections')
// )

export const useCollection = <T = any>(
  getRef:
    | CollectionReference
    | Query
    | ((uid: string, ...pathParts: string[]) => CollectionReference | Query)
    | undefined,
  pathParts: (string | undefined)[] = [],
) => {
  const { user } = useFirebridge()
  const uid = user?.uid

  const ref = useMemo<CollectionReference | Query | undefined>(() => {
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

  const [snap] = useFirebaseHooksCollection(ref)

  const data = useMemo(() => {
    if (!snap) return undefined

    const data = (snap?.docs ?? []).map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }))
    return data as WithId<T>[]
  }, [snap])

  return data
}
