import { useState, useEffect } from 'react'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

import { useFirebridge } from '../context'

type DocumentReference = FirebaseFirestoreTypes.DocumentReference
type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot

/**
 * @function useDocument
 * A custom hook to subscribe to a Firestore document.
 *
 * This hook listens for real-time updates from the specified Firestore document,
 * and automatically updates the local state when changes occur in the document.
 *
 * @template Data The type of the data expected in the document.
 * @param getRef A reference to the Firestore document, or a function returning such a reference.
 *               The function can use the current user's UID and optional path parts to build the reference.
 * @param pathParts Optional path parts to construct the document reference dynamically.
 * @returns The current state of the document data, or null if the document does not exist.
 *          It returns undefined if the document cannot be fetched (e.g., if the user is not logged in
 *          or the path is incomplete).
 *
 * @example
 * const userProfile = useDocument<UserProfile>(
 *   (uid) => firestore().doc(`users/${uid}`),
 * );
 */
export const useDocument = <Data = any>(
  getRef:
    | DocumentReference
    | ((uid: string, ...pathParts: string[]) => DocumentReference)
    | undefined,
  pathParts: (string | undefined)[] = [],
) => {
  const [value, setValue] = useState<Data | null>()

  const { user, log } = useFirebridge()

  useEffect(() => {
    // Logic to handle user authentication and path validation.
    const uid = user?.uid
    if (!uid) {
      setValue(undefined)
      return
    }

    if (pathParts.includes(undefined)) return () => {}

    // Determine the Firestore document reference.
    const ref =
      typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef

    // Subscribe to the Firestore document.
    return ref?.onSnapshot(onUpdate, onError)
  }, [user, pathParts.join(',')])

  // Function to handle updates from Firestore.
  const onUpdate = (doc: DocumentSnapshot | null) => {
    if (!doc) return

    // Handle the document data and set it as the new state.
    const nextValue = !doc.exists
      ? null
      : { ...(doc.data() as Data), id: doc.id }
    setValue(nextValue)
  }

  // Function to handle errors from Firestore.
  const onError = (error: Error) => {
    setValue(undefined)
    log.error(error)
  }

  return value
}
