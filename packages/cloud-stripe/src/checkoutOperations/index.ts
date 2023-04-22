import { firestore } from 'firebase-admin'
import { config } from 'firebase-functions'
import {
  firestoreSet,
  firestoreAdd,
  firestoreDelete,
  firestoreGet,
  firestoreUpdate,
  readSnapshot,
} from '@firebridge/cloud'

import { TimestampDates, WithId, Checkout } from '../types'

const COLLECTION_PATH = config()?.checkouts?.collection_path ?? 'checkouts'

export const getCheckout = firestoreGet<Checkout>(COLLECTION_PATH)
export const addCheckout = firestoreAdd<Checkout>(COLLECTION_PATH)
export const updateCheckout = firestoreUpdate<Checkout>(COLLECTION_PATH)
export const setCheckout = firestoreSet<Checkout>(COLLECTION_PATH)
export const deleteCheckout = firestoreDelete(COLLECTION_PATH)

export const getCheckoutBySession = async (
  session: string,
): Promise<WithId<Checkout>> => {
  const checkoutQuery = await firestore()
    .collection(COLLECTION_PATH)
    .where('session', '==', session)
    .limit(1)
    .get()

  if (checkoutQuery.size === 0) {
    throw new Error('checkout not found')
  }
  const doc = checkoutQuery.docs[0]

  const checkout = readSnapshot<Checkout>(doc)
  if (!checkout) {
    throw new Error('checkout not found')
  }

  return checkout
}

export const getCheckouts = async ({
  sinceDate,
}: {
  sinceDate?: firestore.Timestamp
}): Promise<WithId<Checkout>[]> => {
  let query = await firestore()
    .collection(COLLECTION_PATH)
    .where('status', '==', 'completed')

  if (sinceDate) {
    query = query.where('dateCreated', '>=', sinceDate)
  }

  const snap = await query.get()

  const docs = snap.docs.map(a => {
    const data = a.data() as TimestampDates<
      Checkout,
      'dateCreated' | 'dateUpdated'
    >
    const dateCreated = data.dateCreated.toDate()
    const dateUpdated = data.dateUpdated.toDate()
    return { ...data, id: a.id, dateCreated, dateUpdated } as WithId<Checkout>
  })

  return docs
}
