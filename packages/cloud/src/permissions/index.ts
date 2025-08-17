import { getUserPermissions } from './actions'

/**
 * @function userHasPermission
 * @description A function to check if a user has a specific permission.
 * @param {string} uid - The unique identifier for the user.
 * @param {...string} scopeParts - The parts of the scope to check for permission.
 * @returns {Promise<boolean>} - A Promise that resolves with a boolean indicating whether the user has the specified permission.
 */
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

// Export all actions and types from the current module.
export * from './actions'
export * from './keys'
