import { useState, useEffect } from 'react'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

import { useFirebridge } from '../contexts/FirebridgeContext'

interface DocumentListener {
  unsubscribe?: () => void | undefined
}

type DocumentReference = FirebaseFirestoreTypes.DocumentReference
type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot

export const useDocument = <T = any>(
  getRef:
    | DocumentReference
    | ((uid: string, ...pathParts: string[]) => DocumentReference)
    | undefined,
  pathParts: (string | undefined)[] = [],
) => {
  const [value, setValue] = useState<T | null>()

  const { user, log } = useFirebridge()

  useEffect(() => {
    // If the user is not logged in, we don't attempt to fetch the collection.
    // This is because Firebridge assumes all collections are private.
    const uid = user?.uid
    if (!uid) {
      setValue(undefined)
      return
    }

    // If any of the path parts are undefined, we don't attempt to fetch the
    // collection. This is because we don't know what the path should be.
    if (pathParts.includes(undefined)) return () => {}

    const ref =
      typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef

    return ref?.onSnapshot(onUpdate, onError)
  }, [user, pathParts.join(',')])

  const onUpdate = (doc: DocumentSnapshot | null) => {
    if (!doc) return

    const nextValue = !doc.exists ? null : { ...(doc.data() as T), id: doc.id }
    setValue(nextValue)
  }

  const onError = (error: Error) => {
    // If there is an error, we want to log it and return undefined so that we
    // can clear the current value.
    setValue(undefined)
    log.error(error)
  }

  return value
}
