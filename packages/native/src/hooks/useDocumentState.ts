import { useState, useEffect } from 'react'
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore'

import { useFirebridge } from '@firebridge/native'

type Value<T> = T | null | undefined
type setValue<T> = (nextValue: T | null, options?: any) => Promise<void>

interface DocumentListener {
  unsubscribe?: () => void | undefined
}

type DocumentReference = FirebaseFirestoreTypes.DocumentReference
type DocumentSnapshot = FirebaseFirestoreTypes.DocumentSnapshot

export const useDocumentState = <T = any>(
  getRef:
    | DocumentReference
    | ((uid: string, ...pathParts: string[]) => DocumentReference)
    | undefined,
  pathParts: (string | undefined)[] = [],
): [Value<T>, setValue<T>] => {
  const [localValue, setLocalValue] = useState<T | null>()
  const [listener, setListener] = useState<DocumentListener>()

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

  const onUpdate = (doc: DocumentSnapshot | null) => {
    if (!doc) return

    const nextValue = !doc.exists ? null : { ...(doc.data() as T), id: doc.id }
    setLocalValue(nextValue)
  }

  const onError = (error: Error) => {
    log.error(error)
  }

  const setValue = async (nextValue: T | null, merge?: boolean) => {
    if (nextValue === localValue) {
      return
    }

    // If the user is not logged in, we don't attempt to fetch the collection.
    // This is because Firebridge assumes all collections are private.
    const uid = user?.uid
    if (!uid) return

    // If any of the path parts are undefined, we don't attempt to fetch the
    // collection. This is because we don't know what the path should be.
    if (pathParts.includes(undefined)) return

    const ref =
      typeof getRef === 'function'
        ? getRef(uid, ...(pathParts as string[]))
        : getRef

    if (merge && nextValue) {
      setLocalValue((currentValue) =>
        currentValue ? { ...currentValue, ...nextValue } : nextValue,
      )
    } else {
      setLocalValue(nextValue)
    }

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
