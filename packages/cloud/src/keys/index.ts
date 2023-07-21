import { v4 as uuid } from 'uuid'
import { createHash } from 'crypto'

import { firestoreGet, firestoreSet } from '../actions'

interface ApiKey {
  uid: string
  claims?: any
}

export const getKey = firestoreGet<ApiKey>('keys')
export const setKey = firestoreSet<ApiKey>('keys')

export const generateKey = (forUid: string) => {
  const apiKey = uuid()
  const hashed = createHash('md5').update(apiKey).digest('hex')
  setKey(hashed, { uid: forUid })

  return apiKey
}
