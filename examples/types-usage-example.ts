// Note: @repo/types is an internal workspace package and not published to npm
// In your own project, you would typically define these types yourself
// or they may be exported from other @firebridge packages

// These types are commonly used across Firebridge packages
// You can copy these type definitions into your own project

export type WithId<T> = T & { id: string }

export type UserPermissions = {
  role?: string | null
  roles?: Record<string, string>
  scopes?: { [scope: string]: boolean }
  isAdmin?: boolean
}

export type BaseErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

export const baseErrorCodes: BaseErrorCode[] = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INTERNAL_SERVER_ERROR',
  'NETWORK_ERROR',
  'UNKNOWN_ERROR',
]

export type PlatformError<C = BaseErrorCode> = {
  type: 'PlatformError'
  message: string
  code: C
  status: number
  timestamp: string
}

export type FirestoreTimestamp = {
  seconds: number
  nanoseconds: number
}

export type SerializedFirestoreTimestamp = {
  seconds?: number
  nanoseconds?: number
  _seconds?: number
  _nanoseconds?: number
}

export type PossiblyMissing<T> = T | undefined | null

export type EditorialMetadata<TS = FirestoreTimestamp> = {
  timeCreated: TS
  timeUpdated?: TS
}

export type WithEditorialMetadata<T, TS = FirestoreTimestamp> = T & {
  metadata: EditorialMetadata<TS>
}

// Example 1: Using WithId type for Firestore documents
type User = {
  name: string
  email: string
  age: number
}

// When retrieving documents from Firestore, they come with an ID
type UserWithId = WithId<User>

const processUsers = (users: UserWithId[]) => {
  users.forEach(user => {
    console.log(`User ${user.id}: ${user.name} (${user.email})`)
    // user.id is guaranteed to be available as a string
  })
}

// Example usage
const exampleUsers: UserWithId[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 25,
  },
]

processUsers(exampleUsers)

// Example 2: Using UserPermissions for authorization
const checkUserAccess = (
  permissions: UserPermissions,
  requiredScope: string,
): boolean => {
  // Check if user is admin
  if (permissions.isAdmin) {
    return true
  }

  // Check if user has specific scope
  if (permissions.scopes?.[requiredScope]) {
    return true
  }

  // Check role-based access
  if (
    permissions.role === 'moderator' &&
    requiredScope.startsWith('content:')
  ) {
    return true
  }

  return false
}

// Example user permissions
const adminUser: UserPermissions = {
  role: 'admin',
  isAdmin: true,
  scopes: {
    'users:read': true,
    'users:write': true,
    'content:moderate': true,
  },
}

const regularUser: UserPermissions = {
  role: 'user',
  isAdmin: false,
  scopes: {
    'profile:read': true,
    'profile:write': true,
  },
}

const moderatorUser: UserPermissions = {
  role: 'moderator',
  isAdmin: false,
  roles: {
    forum: 'moderator',
    support: 'agent',
  },
  scopes: {
    'content:read': true,
    'content:moderate': true,
    'users:read': true,
  },
}

console.log(
  'Admin can moderate content:',
  checkUserAccess(adminUser, 'content:moderate'),
)
console.log(
  'Regular user can moderate content:',
  checkUserAccess(regularUser, 'content:moderate'),
)
console.log(
  'Moderator can moderate content:',
  checkUserAccess(moderatorUser, 'content:moderate'),
)

// Example 3: Using PlatformError for standardized error handling
const createPlatformError = (
  message: string,
  code: BaseErrorCode,
): PlatformError => ({
  type: 'PlatformError',
  message,
  code,
  status: getStatusFromCode(code),
  timestamp: new Date().toISOString(),
})

const getStatusFromCode = (code: BaseErrorCode): number => {
  switch (code) {
    case 'BAD_REQUEST':
      return 400
    case 'UNAUTHORIZED':
      return 401
    case 'FORBIDDEN':
      return 403
    case 'NOT_FOUND':
      return 404
    case 'INTERNAL_SERVER_ERROR':
      return 500
    case 'NETWORK_ERROR':
      return 503
    case 'UNKNOWN_ERROR':
      return 500
    default:
      return 500
  }
}

// Custom error codes extending base ones
type AppErrorCode =
  | BaseErrorCode
  | 'INVALID_INPUT'
  | 'USER_SUSPENDED'
  | 'RATE_LIMITED'

type AppError = PlatformError<AppErrorCode>

const handleApiError = (error: AppError) => {
  console.error(`[${error.code}] ${error.message}`)

  // Handle different error types
  switch (error.code) {
    case 'UNAUTHORIZED':
      // Redirect to login
      console.log('Redirecting to login...')
      break
    case 'FORBIDDEN':
      // Show access denied message
      console.log('Access denied')
      break
    case 'NOT_FOUND':
      // Show 404 page
      console.log('Resource not found')
      break
    case 'RATE_LIMITED':
      // Show rate limit message
      console.log('Too many requests, please try again later')
      break
    default:
      // Generic error message
      console.log('An error occurred')
  }
}

// Example error instances
const unauthorizedError: AppError = createPlatformError(
  'Authentication required',
  'UNAUTHORIZED',
) as AppError

const notFoundError: AppError = createPlatformError(
  'User not found',
  'NOT_FOUND',
) as AppError

handleApiError(unauthorizedError)
handleApiError(notFoundError)

// Validate error codes
const isValidErrorCode = (code: string): code is BaseErrorCode =>
  baseErrorCodes.includes(code as BaseErrorCode)

console.log('Is UNAUTHORIZED valid?', isValidErrorCode('UNAUTHORIZED'))
console.log('Is INVALID_CODE valid?', isValidErrorCode('INVALID_CODE'))

// Example 4: Working with FirestoreTimestamp types
const processTimestamp = (timestamp: FirestoreTimestamp): Date =>
  new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000)

const processSerializedTimestamp = (
  timestamp: SerializedFirestoreTimestamp,
): Date | null => {
  const seconds = timestamp.seconds ?? timestamp._seconds
  const nanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0

  if (seconds === undefined) {
    return null
  }

  return new Date(seconds * 1000 + nanoseconds / 1000000)
}

// Example timestamps
const firestoreTimestamp: FirestoreTimestamp = {
  seconds: 1647875400,
  nanoseconds: 0,
}

const serializedTimestamp: SerializedFirestoreTimestamp = {
  _seconds: 1647875400,
  _nanoseconds: 0,
}

console.log('Firestore timestamp:', processTimestamp(firestoreTimestamp))
console.log(
  'Serialized timestamp:',
  processSerializedTimestamp(serializedTimestamp),
)

// Example 5: Using PossiblyMissing for optional data
const processOptionalData = (data: PossiblyMissing<string>): string => {
  if (data === null || data === undefined) {
    return 'No data available'
  }
  return data
}

// Example usage with possibly missing data
const validData: PossiblyMissing<string> = 'Hello, world!'
const nullData: PossiblyMissing<string> = null
const undefinedData: PossiblyMissing<string> = undefined

console.log(processOptionalData(validData)) // "Hello, world!"
console.log(processOptionalData(nullData)) // "No data available"
console.log(processOptionalData(undefinedData)) // "No data available"

// Example 6: Using EditorialMetadata for document tracking
type Article = {
  title: string
  content: string
  authorId: string
  published: boolean
}

type ArticleWithMetadata = WithEditorialMetadata<Article>

const createArticle = (article: Article): ArticleWithMetadata => {
  const now: FirestoreTimestamp = {
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: (Date.now() % 1000) * 1000000,
  }

  return {
    ...article,
    metadata: {
      timeCreated: now,
      timeUpdated: now,
    },
  }
}

const updateArticle = (
  article: ArticleWithMetadata,
  updates: Partial<Article>,
): ArticleWithMetadata => {
  const now: FirestoreTimestamp = {
    seconds: Math.floor(Date.now() / 1000),
    nanoseconds: (Date.now() % 1000) * 1000000,
  }

  return {
    ...article,
    ...updates,
    metadata: {
      ...article.metadata,
      timeUpdated: now,
    },
  }
}

// Example usage
const newArticle: Article = {
  title: 'Getting Started with TypeScript',
  content: 'TypeScript is a typed superset of JavaScript...',
  authorId: 'author123',
  published: false,
}

const articleWithMetadata = createArticle(newArticle)
console.log('Created article:', articleWithMetadata)

const updatedArticle = updateArticle(articleWithMetadata, {
  published: true,
  title: 'Getting Started with TypeScript - Updated',
})
console.log('Updated article:', updatedArticle)

// Example 7: Using metadata with custom timestamp type (for non-Firestore contexts)
// Note: For Firestore storage, always use Timestamp from firebase-admin/firestore
type ArticleWithDateMetadata = WithEditorialMetadata<Article, Date>

const createArticleWithDates = (article: Article): ArticleWithDateMetadata => {
  const now = new Date()

  return {
    ...article,
    metadata: {
      timeCreated: now,
      timeUpdated: now,
    },
  }
}

const articleWithDates = createArticleWithDates(newArticle)
console.log(
  'Article with Date metadata (for non-Firestore use):',
  articleWithDates,
)

// Example 8: Complex type composition
type CompleteUser = WithId<
  WithEditorialMetadata<
    User & {
      permissions: UserPermissions
      preferences: {
        theme: 'light' | 'dark'
        notifications: boolean
        language: string
      }
      timeLastLoggedIn: PossiblyMissing<FirestoreTimestamp>
    }
  >
>

const processCompleteUser = (user: CompleteUser) => {
  console.log(`Processing user ${user.id}: ${user.name}`)
  console.log(`Created: ${processTimestamp(user.metadata.timeCreated)}`)
  console.log(
    `Last updated: ${user.metadata.timeUpdated ? processTimestamp(user.metadata.timeUpdated) : 'Never'}`,
  )
  console.log(`Is admin: ${user.permissions.isAdmin}`)
  console.log(`Theme preference: ${user.preferences.theme}`)

  if (user.timeLastLoggedIn) {
    console.log(`Last login: ${processTimestamp(user.timeLastLoggedIn)}`)
  } else {
    console.log('Never logged in')
  }
}

// This example demonstrates how all the types can work together
const completeUser: CompleteUser = {
  id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  permissions: adminUser,
  preferences: {
    theme: 'dark',
    notifications: true,
    language: 'en',
  },
  timeLastLoggedIn: firestoreTimestamp,
  metadata: {
    timeCreated: firestoreTimestamp,
    timeUpdated: {
      seconds: 1647875500,
      nanoseconds: 0,
    },
  },
}

processCompleteUser(completeUser)
