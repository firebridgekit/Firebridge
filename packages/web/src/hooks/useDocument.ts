import { DocumentReference, FirestoreError } from 'firebase/firestore'
import { useMemo } from 'react'
import { useDocument as useFirebaseHooksDocument } from 'react-firebase-hooks/firestore'

import { useFirebridge } from '../context'
import { readSnapshot } from '../utils'

/**
 * @function useDocument
 * Custom hook to fetch a realtime Firestore document.
 *
 * This hook is useful for situations where the path to the document in Firestore
 * is dynamically determined and may include parts that are unknown at runtime.
 * It ensures that data is fetched only when the user is logged in and all path parts are defined.
 *
 * @template Data The expected type of the document.
 * @param getRef A reference to the Firestore document, or a function returning such a reference.
 *               This function can use the current user's UID and optional path parts to build the reference.
 * @param pathParts An array of path parts that are used to construct the document reference dynamically.
 *                  If any path part is undefined, the hook does not attempt to fetch the document.
 * @returns The document data with its document ID, null if the document does not exist, or undefined if the document
 *          cannot be fetched due to missing path parts or user authentication status.
 *
 * @example
 * const userProfile = useDocument<UserProfile>(
 *   (uid) => doc(firestore, 'users', uid),
 *   [userId]
 * );
 */

type UseDocumentOptions = {
  onError?: (error: FirestoreError | undefined) => void
}

export const useDocument = <Data = any>(
  getRef:
    | DocumentReference
    | ((uid: string, ...pathParts: string[]) => DocumentReference)
    | undefined,
  pathParts: (string | undefined)[] = [],
  options: UseDocumentOptions = {},
) => {
  const { user, log } = useFirebridge()
  const uid = user?.uid

  // Memoize the Firestore document reference.
  const ref = useMemo<DocumentReference | undefined>(() => {
    // Guard clauses for user authentication and path validation.
    if (!uid || pathParts.includes(undefined)) {
      return undefined
    } else {
      return typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef
    }
  }, [getRef, pathParts, uid])

  // Use the Firebase hooks to subscribe to the Firestore document.
  const [doc, loading, error] = useFirebaseHooksDocument(ref)

  // Process the document data.
  const value = useMemo(() => {
    // If the document is not yet available, return undefined.
    if (!doc || loading) {
      return undefined
    }

    // If an error occurred, log it and call the error handler.
    if (error) {
      log.error(error)
      options.onError?.(error)
      return undefined
    }

    // Include the document ID in the returned data.
    return readSnapshot<Data>(doc)
  }, [doc, loading, error])

  return value
}
