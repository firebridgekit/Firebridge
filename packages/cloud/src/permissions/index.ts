import { getUserPermissions } from './firestore'

export const userHasPermission = async (
  uid: string,
  ...scopeParts: string[]
) => {
  const permissions = await getUserPermissions(uid)
  const { scopes } = permissions || {}

  for (let i = 1; i <= scopeParts.length; i++) {
    const refinedScope = scopeParts.slice(0, i).join('/')
    if (scopes?.[refinedScope]) {
      return true
    }
  }

  return false
}

export * from './firestore'
export * from './type'
