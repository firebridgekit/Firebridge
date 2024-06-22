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

import { CollectionReference, FirestoreError, Query } from 'firebase/firestore'
import { useMemo } from 'react'
import { useCollection as useFirebaseHooksCollection } from 'react-firebase-hooks/firestore'

import { useFirebridge } from '../context'
import { WithId } from '../types'

type UseCollectionOptions = {
  onError?: (error: FirestoreError | undefined) => void
}

/**
 * @function useCollection
 * Custom hook to fetch a realtime Firestore collection.
 *
 * This hook is useful for situations where the path to the collection in Firestore
 * is dynamically determined and may include parts that are unknown at runtime.
 * It ensures that data is fetched only when the user is logged in and all path parts are defined.
 *
 * @template Data The expected type of the documents in the collection.
 * @param getRef A reference to the Firestore collection or query, or a function returning such a reference.
 *               This function can use the current user's UID and optional path parts to build the reference.
 * @param pathParts An array of path parts that are used to construct the collection or query reference dynamically.
 *                  If any path part is undefined, the hook does not attempt to fetch the collection.
 * @returns An array of documents from the collection, each augmented with its document ID, or undefined if the collection
 *          cannot be fetched due to missing path parts or user authentication status.
 *
 * @example
 * const topicPosts = useCollection<Post>(
 *   (_uid, topicId) => collection(firestore, 'topics', topicId, 'posts'),
 *   [topicId]
 * );
 */
export const useCollection = <Data = any>(
  getRef:
    | CollectionReference
    | Query
    | ((uid: string, ...pathParts: string[]) => CollectionReference | Query)
    | undefined,
  pathParts: (string | undefined)[] = [],
  options: UseCollectionOptions = {},
) => {
  const { user, log } = useFirebridge()
  const uid = user?.uid

  // Memoize the Firestore reference.
  const ref = useMemo<CollectionReference | Query | undefined>(() => {
    // Guard clauses for user authentication and path validation.
    if (!uid || pathParts.includes(undefined)) {
      return undefined
    } else {
      return typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef
    }
  }, [getRef, pathParts, uid])

  // Use the Firebase hooks to subscribe to the Firestore collection.
  const [snap, loading, error] = useFirebaseHooksCollection(ref)

  // Process the snapshot data.
  const data = useMemo(() => {
    // If the collection is loading, return undefined.
    if (loading) {
      return undefined
    }

    // If an error occurred, log it and call the error handler.
    if (error) {
      log.error(error)
      options.onError?.(error)
      return undefined
    }

    if (!snap) {
      return undefined
    }

    // Map the documents to include their IDs.
    const data = snap.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }))

    return data as WithId<Data>[]
  }, [snap])

  return data
}
