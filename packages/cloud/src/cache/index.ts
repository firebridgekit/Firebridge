import { WriteResult } from 'firebase-admin/firestore'
import crypto from 'crypto'

import { firestoreGet, firestoreSet } from '../actions'

export class Cache<T> {
  path: string
  get: (key: string) => Promise<T | undefined>
  set: (key: string, value: T) => Promise<WriteResult>
  hash: (key: string) => string

  constructor(namespace: string) {
    this.path = `cache/${namespace}/values`

    // Hash the key to a string so that it can be used as a document ID
    this.hash = key => {
      if (typeof key !== 'string') {
        throw new Error('Key must be a string')
      }
      if (key.length === 0) {
        throw new Error('Key must not be empty')
      }
      return crypto.createHash('sha256').update(key).digest('hex')
    }

    // Get and set the value in Firestore
    this.get = (key: string) => {
      const hash = this.hash(key)

      if (!hash) {
        throw new Error('Cache hash is empty')
      }

      return firestoreGet<T>(this.path)(hash)
    }

    this.set = (key: string, value: T) => {
      const hash = this.hash(key)

      if (!hash) {
        throw new Error('Cache hash is empty')
      }

      return firestoreSet<T>(this.path)(hash, value)
    }
  }
}
