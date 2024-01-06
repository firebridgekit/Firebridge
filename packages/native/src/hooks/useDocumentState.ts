import { useState, useEffect } from 'react'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

import { useFirebridge } from '../context'

type Value<Data> = Data | null | undefined
type setValue<Data> = (nextValue: Data | null, options?: any) => Promise<void>

type DocumentReference = FirebaseFirestoreTypes.DocumentReference
type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot

/**
 * @function useDocumentState
 * A custom hook to manage the state of a Firestore document.
 *
 * This hook provides functionality to read, update, and delete a Firestore document,
 * and to automatically update the local state when changes occur in the document.
 *
 * @template T The type of the data expected in the document.
 * @param getRef A reference to the Firestore document, or a function returning such a reference.
 *               The function can use the current user's UID and optional path parts to build the reference.
 * @param pathParts Optional path parts to construct the document reference dynamically.
 * @returns A tuple containing the current state of the document data and a function to set the state.
 *          The set function can update or delete the Firestore document.
 *
 * @example
 * const [userProfile, setUserProfile] = useDocumentState<UserProfile>(
 *   (uid) => firestore().doc(`users/${uid}`),
 * );
 */
export const useDocumentState = <Data = any>(
  getRef:
    | DocumentReference
    | ((uid: string, ...pathParts: string[]) => DocumentReference)
    | undefined,
  pathParts: (string | undefined)[] = [],
): [Value<Data>, setValue<Data>] => {
  const [localValue, setLocalValue] = useState<Data | null>()
  const { user, log } = useFirebridge()

  useEffect(() => {
    // Logic to handle user authentication and path validation.
    const uid = user?.uid
    if (!uid) {
      setLocalValue(undefined)
      return
    }

    if (pathParts.includes(undefined)) return () => {}

    // Determine the Firestore document reference.
    const ref =
      typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef

    // Subscribe to the Firestore document.
    const unsubscribe = ref?.onSnapshot(onUpdate, onError)
    return unsubscribe
  }, [user, pathParts.join(',')])

  // Function to handle updates from Firestore.
  const onUpdate = (doc: DocumentSnapshot | null) => {
    if (!doc) return

    // Handle the document data and set it as the new state.
    const nextValue = !doc.exists
      ? null
      : { ...(doc.data() as Data), id: doc.id }
    setLocalValue(nextValue)
  }

  // Function to handle errors from Firestore.
  const onError = (error: Error) => {
    log.error(error)
  }

  // Function to update or delete the document in Firestore and update the local state.
  const setValue = async (nextValue: Data | null, merge?: boolean) => {
    // Guard clauses for user authentication and path validation.
    if (nextValue === localValue) return
    const uid = user?.uid
    if (!uid) return
    if (pathParts.includes(undefined)) return

    // Determine the Firestore document reference.
    const ref =
      typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef

    // Update the local state and Firestore document.
    if (merge && nextValue) {
      setLocalValue(currentValue =>
        currentValue ? { ...currentValue, ...nextValue } : nextValue,
      )
    } else {
      setLocalValue(nextValue)
    }

    // Firestore operations to set or delete the document.
    if (ref) {
      if (nextValue) {
        await ref.set(nextValue, merge ? { merge: true } : undefined)
      } else if (nextValue === null) {
        await ref.delete()
      }
    }
  }

  return [localValue, setValue]
}
