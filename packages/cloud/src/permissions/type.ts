export interface UserPermissions {
  role?: string | null
  scopes?: { [scope: string]: boolean }
}
