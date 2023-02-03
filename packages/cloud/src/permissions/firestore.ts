import { firestoreGet, firestoreSet, firestoreMerge } from '../actions'
import { UserPermissions } from './type'

export const getUserPermissions = firestoreGet<UserPermissions>('permissions')
export const setUserPermissions = firestoreSet<UserPermissions>('permissions')
export const mergeUserPermissions =
  firestoreMerge<UserPermissions>('permissions')
