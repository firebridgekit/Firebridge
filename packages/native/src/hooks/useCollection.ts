import { useState, useEffect } from 'react'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

import { useFirebridge } from '../context'

type CollectionReference = FirebaseFirestoreTypes.CollectionReference
type Query = FirebaseFirestoreTypes.Query
type QuerySnapshot = FirebaseFirestoreTypes.QuerySnapshot

/**
 * @function useCollection
 * A custom hook to subscribe to a Firestore collection or query.
 *
 * It listens for real-time updates from the specified Firestore collection or query,
 * and automatically updates the local state when changes occur in the collection.
 *
 * @template Data The type of the data expected in each document of the collection.
 * @param getRef A reference to the Firestore collection or query, or a function returning such a reference.
 *               The function can use the current user's UID and optional path parts to build the reference.
 * @param pathParts Optional path parts to construct the collection or query reference dynamically.
 * @returns The current state of the collection data, including document IDs, or undefined if the collection
 *          cannot be fetched (e.g., if the user is not logged in or the path is incomplete).
 *
 * @example
 * const messages = useCollection<Message>(
 *   (uid) => firestore().collection(`users/${uid}/messages`),
 * );
 */
export const useCollection = <Data>(
  getRef:
    | CollectionReference
    | Query
    | ((uid: string, ...pathParts: string[]) => CollectionReference | Query)
    | undefined,
  pathParts: (string | undefined)[] = [],
) => {
  const [value, setValue] = useState<(Data & { id: string })[]>()
  const { user, log } = useFirebridge()

  useEffect(() => {
    // Logic to handle user authentication and path validation.
    const uid = user?.uid
    if (!uid) {
      setValue(undefined)
      return
    }

    if (pathParts.includes(undefined)) return

    // Determine the Firestore reference.
    const ref =
      typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef

    // Subscribe to the Firestore reference.
    const unsubscribe = ref?.onSnapshot(onUpdate, onError)
    return unsubscribe
  }, [user, pathParts.join(',')])

  // Function to handle updates from Firestore.
  const onUpdate = async (querySnap: QuerySnapshot | null) => {
    if (!querySnap) {
      return
    }
    const allDocs = querySnap.docs
    const nextValue: (Data & { id: string })[] = []
    for (const doc of allDocs) {
      nextValue.push({
        ...(doc.data() as Data),
        id: doc.id,
      })
    }
    setValue(nextValue)
  }

  // Function to handle errors from Firestore.
  const onError = (error: Error) => {
    setValue(undefined)
    log.error(error)
  }

  return value
}
