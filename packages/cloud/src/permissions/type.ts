export interface UserPermissions {
  role?: string | null
  roles?: Record<string, string>
  scopes?: { [scope: string]: boolean }
  isAdmin?: boolean
}
