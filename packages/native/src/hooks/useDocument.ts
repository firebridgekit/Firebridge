import { useState, useEffect } from 'react'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

import { useFirebridge } from '../contexts/FirebridgeContext'

type DocumentReference = FirebaseFirestoreTypes.DocumentReference

export const useAuthedDocument = <T = any>(
  getRef:
    | DocumentReference
    | ((uid: string, ...pathParts: string[]) => DocumentReference)
    | undefined,
  pathParts: (string | undefined)[] = [],
) => {
  const [value, setValue] = useState<T | null>()
  const [listener, setListener] = useState<{ unsubscribe?: () => void }>({})

  const { user, log } = useFirebridge()

  useEffect(() => {
    // if there's an existing listener, we should unsubscribe from it first
    listener?.unsubscribe?.()

    // If the user is not logged in, we don't attempt to fetch the collection.
    // This is because Firebridge assumes all collections are private.
    const uid = user?.uid
    if (!uid) return () => {}

    // If any of the path parts are undefined, we don't attempt to fetch the
    // collection. This is because we don't know what the path should be.
    if (pathParts.includes(undefined)) return () => {}

    const ref =
      typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef

    const unsubscribe = ref?.onSnapshot(onUpdate, onError)
    setListener({ unsubscribe })
    return unsubscribe
  }, [user, pathParts])

  const onUpdate = (doc: FirebaseFirestoreTypes.DocumentSnapshot | null) => {
    if (!doc) return

    const nextValue = !doc.exists ? null : { ...(doc.data() as T), id: doc.id }
    setValue(nextValue)
  }

  const onError = (error: Error) => {
    log.error(error)
  }

  return value
}
