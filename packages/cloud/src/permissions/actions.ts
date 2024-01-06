import { firestoreGet, firestoreSet, firestoreMerge } from '../actions'
import { UserPermissions } from './type'

/**
 * @function getUserPermissions
 * @description A function to get a user's permissions from the 'permissions' collection in Firestore.
 * @returns {Function} - A function that takes a document ID and returns a Promise that resolves with the user's permissions or undefined if the document does not exist.
 */
export const getUserPermissions = firestoreGet<UserPermissions>('permissions')

/**
 * @function setUserPermissions
 * @description A function to set a user's permissions in the 'permissions' collection in Firestore.
 * @returns {Function} - A function that takes a document ID and a permissions object, sets the document in the specified collection, and returns a Promise that resolves with a DocumentReference.
 */
export const setUserPermissions = firestoreSet<UserPermissions>('permissions')

/**
 * @function mergeUserPermissions
 * @description A function to merge a user's permissions in the 'permissions' collection in Firestore.
 * @returns {Function} - A function that takes a document ID and a permissions object, merges the document in the specified collection, and returns a Promise that resolves with a DocumentReference.
 */
export const mergeUserPermissions =
  firestoreMerge<UserPermissions>('permissions')
