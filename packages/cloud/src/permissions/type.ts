/**
 * @interface UserPermissions
 * @description Represents the permissions of a user.
 * @property {string | null} [role] - The role of the user. If the user does not have a role, this property can be null.
 * @property {Record<string, string>} [roles] - An object representing the roles of the user. The keys are the role names and the values are the role values.
 * @property {Object.<string, boolean>} [scopes] - An object representing the scopes of the user. The keys are the scope names and the values are booleans indicating whether the user has the scope.
 * @property {boolean} [isAdmin] - A boolean indicating whether the user is an admin.
 */
export interface UserPermissions {
  role?: string | null
  roles?: Record<string, string>
  scopes?: { [scope: string]: boolean }
  isAdmin?: boolean
}
