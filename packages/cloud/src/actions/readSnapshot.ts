import { firestore } from 'firebase-admin'
import { WithId } from '../type'

interface Snapshot {
  id: string
  data: () => { [field: string]: any } | undefined
  exists: boolean | (() => boolean)
}

export const readSnapshot = <T = any>(doc: Snapshot) =>
  (typeof doc.exists === 'function' && doc.exists()) || doc.exists
    ? ({ ...doc?.data(), id: doc.id } as WithId<T>)
    : undefined

export const readQuerySnapshot = <T = any>(snap: firestore.QuerySnapshot) =>
  snap.docs
    .map(doc => readSnapshot<T>(doc))
    .filter(doc => doc !== undefined) as WithId<T>[]
