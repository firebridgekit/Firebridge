import { firestore } from 'firebase-admin'

type DocumentChangeType = 'create' | 'update' | 'delete'

export const getChangeType = (change: {
  before: firestore.DocumentSnapshot
  after: firestore.DocumentSnapshot
}): DocumentChangeType => {
  if (!change.after.exists) {
    return 'delete'
  }
  if (!change.before.exists) {
    return 'create'
  }
  return 'update'
}
