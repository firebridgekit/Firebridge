import { useState, useEffect } from 'react'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

import { useFirebridge } from '../contexts/FirebridgeContext'

interface CollectionListener {
  unsubscribe?: () => void | undefined
}

type CollectionReference = FirebaseFirestoreTypes.CollectionReference
type Query = FirebaseFirestoreTypes.Query
type QuerySnapshot = FirebaseFirestoreTypes.QuerySnapshot

export const useCollection = <T>(
  getRef:
    | CollectionReference
    | Query
    | ((uid: string, ...pathParts: string[]) => CollectionReference | Query)
    | undefined,
  pathParts: (string | undefined)[] = [],
) => {
  const [value, setValue] = useState<(T & { id: string })[]>()
  const [listener, setListener] = useState<CollectionListener>({})

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
  }, [user, pathParts.join(',')])

  const onUpdate = async (querySnap: QuerySnapshot | null) => {
    if (!querySnap) {
      return
    }
    const allDocs = querySnap.docs
    const nextValue: (T & { id: string })[] = []
    for (const doc of allDocs) {
      nextValue.push({
        ...(doc.data() as T),
        id: doc.id,
      })
    }
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
