import { v4 as uuid } from 'uuid'
import { createHash } from 'crypto'

import { firestoreGet, firestoreSet } from '../actions'

/**
 * @typedef ApiKey
 * @property {string} uid - The unique identifier for the user.
 * @property {any} [claims] - The claims associated with the user.
 */
type ApiKey = {
  uid: string
  claims?: any
}

/**
 * @function getKey
 * @description A function to get a key from the 'keys' collection in Firestore.
 */
export const getKey = firestoreGet<ApiKey>('keys')

/**
 * @function setKey
 * @description A function to set a key in the 'keys' collection in Firestore.
 */
export const setKey = firestoreSet<ApiKey>('keys')

/**
 * @function generateKey
 * @description A function to generate a unique API key for a user.
 * @param {string} forUid - The unique identifier for the user.
 * @returns {string} - The generated API key.
 */
export const generateKey = (forUid: string) => {
  const apiKey = uuid()
  const hashed = createHash('md5').update(apiKey).digest('hex')
  setKey(hashed, { uid: forUid })

  return apiKey
}
