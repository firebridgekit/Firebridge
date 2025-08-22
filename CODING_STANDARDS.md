# Firebridge Coding Standards

This document outlines the coding standards and conventions used throughout the Firebridge project.

## 🎯 Type Definition Standards

### ✅ Preferred: Type Aliases Over Interfaces

Always use `type` instead of `interface` for defining data structures:

```typescript
// ✅ Correct - type alias
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  timeLastLoggedIn: Timestamp;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};

// ❌ Avoid - interface (also shows incorrect Date usage)
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date; // Should use Timestamp and proper naming
}
```

### ✅ Intersection Types for Composition

Use intersection types (`&`) for combining types:

```typescript
// ✅ Correct - intersection types
export type UserWithMetadata = User & WithEditorialMetadata;

export type Product = Sellable & {
  category: string;
  stockQuantity: number;
};

// ❌ Avoid - interface extension (also shows incorrect Date usage)
export interface UserWithMetadata extends User {
  createdAt: Date; // Should use metadata pattern instead
  updatedAt: Date; // Should use metadata pattern instead
}
```

### ✅ Union Types for Variants

Use union types for defining variants and discriminated unions:

```typescript
// ✅ Correct - union types
export type Status = 'pending' | 'completed' | 'failed';

export type ApiError = 
  | { type: 'network'; message: string }
  | { type: 'validation'; errors: string[] }
  | { type: 'auth'; reason: string };
```

## ⏰ Timestamp Conventions

### ✅ Always Use Firebase Timestamps for Stored Values

Never use JavaScript `Date` objects for values that will be stored in Firestore. Always use Firebase `Timestamp`:

```typescript
// ✅ Correct - Firebase Timestamp for stored values
import { Timestamp } from 'firebase-admin/firestore';

type UserProfile = {
  name: string;
  email: string;
  timeLastLoggedIn: Timestamp;
};

// ✅ Correct - Setting timestamp values
await updateUser(userId, {
  timeLastLoggedIn: Timestamp.now()
});

// ❌ Avoid - JavaScript Date for stored values
type UserProfile = {
  name: string;
  email: string;
  lastLogin: Date; // Will lose precision and querying capabilities
};

await updateUser(userId, {
  lastLogin: new Date() // Cannot query/sort efficiently
});
```

### ✅ Timestamp Field Naming Convention

Always prefix timestamp fields with `time` followed by a descriptive name:

```typescript
// ✅ Correct - "time" prefix
type Post = {
  title: string;
  content: string;
  timeCreated: Timestamp;    // Handled by metadata
  timeUpdated: Timestamp;    // Handled by metadata  
  timePublished: Timestamp;  // Custom business logic timestamp
  timeLastViewed: Timestamp; // User interaction timestamp
};

// ❌ Avoid - inconsistent naming
type Post = {
  title: string;
  content: string;
  createdAt: Timestamp;      // Inconsistent with convention
  publishedDate: Timestamp;  // "Date" suffix is misleading
  lastView: Timestamp;       // Missing "time" prefix
};
```

### ✅ Metadata Pattern for Standard Timestamps

Use the established metadata pattern for `timeCreated` and `timeUpdated`:

```typescript
// ✅ Correct - Use metadata for standard timestamps
type ArticleWithMetadata = WithEditorialMetadata<Article>;

// The metadata automatically provides:
// - timeCreated: handled on document creation
// - timeUpdated: handled on document updates

// Only add custom timestamps for business-specific events
type Article = {
  title: string;
  content: string;
  timePublished?: Timestamp;     // When article was published
  timeLastViewed?: Timestamp;    // When article was last viewed
  timeArchived?: Timestamp;      // When article was archived
};

// ❌ Avoid - Duplicating metadata functionality
type Article = {
  title: string;
  content: string;
  timeCreated: Timestamp;        // Use metadata instead
  timeUpdated: Timestamp;        // Use metadata instead
  timePublished?: Timestamp;
};
```

### ✅ Benefits of Firebase Timestamps

- **Precision**: Maintains nanosecond precision
- **Querying**: Enables efficient range queries and sorting
- **Time Zones**: Server timestamps are timezone-independent
- **Consistency**: Ensures consistent time across all clients
- **Ordering**: Reliable ordering for real-time updates

```typescript
// ✅ Correct - Efficient timestamp queries
const recentPosts = await db.collection('posts')
  .where('timePublished', '>=', Timestamp.fromDate(lastWeek))
  .where('timePublished', '<=', Timestamp.now())
  .orderBy('timePublished', 'desc')
  .get();

// ✅ Correct - Converting for display
const displayDate = post.timePublished.toDate().toLocaleDateString();
```

## 🔧 Function Declaration Standards

### ✅ Preferred: Const Arrow Function Exports

Always use `const` arrow function exports instead of traditional function declarations:

```typescript
// ✅ Correct - const arrow function export
export const getUserData = async (userId: string) => {
  const user = await getUser(userId);
  return { ...user, id: userId };
};

// ❌ Avoid - traditional function declaration
export function getUserData(userId: string) {
  // implementation
}
```

### ✅ Single Return Statement Optimization

For functions that only contain a return statement, omit the curly braces and return keyword:

```typescript
// ✅ Correct - single expression
export const formatUser = (user: User) => ({ ...user, formatted: true });

export const isValidEmail = (email: string) => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ❌ Avoid - unnecessary brackets and return
export const formatUser = (user: User) => {
  return { ...user, formatted: true };
};

export const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

### ✅ Complex Returns with Parentheses

For object returns that span multiple lines, use parentheses instead of explicit return:

```typescript
// ✅ Correct - parentheses for object return
export const createUser = (data: UserInput) => ({
  id: generateId(),
  name: data.name,
  email: data.email,
  timeLastLoggedIn: Timestamp.now()
});

// ❌ Avoid - explicit return statement
export const createUser = (data: UserInput) => {
  return {
    id: generateId(),
    name: data.name,
    email: data.email,
    timeLastLoggedIn: new Date() // Should use Timestamp.now()
  };
};
```

### ✅ React Components

Apply the same standards to React components:

```typescript
// ✅ Correct - const arrow function component
export const UserProfile = ({ userId }: { userId: string }) => {
  const { data, loading } = useUser(userId);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
};

// ❌ Avoid - traditional function component
export function UserProfile({ userId }: { userId: string }) {
  // implementation
}
```

### ✅ Async Functions

Maintain consistency with async functions:

```typescript
// ✅ Correct - const arrow async function
export const fetchUserData = async (userId: string) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// ✅ Correct - single async expression
export const validateUser = async (userId: string) => 
  await userExists(userId) && await userIsActive(userId);

// ❌ Avoid - traditional async function
export async function fetchUserData(userId: string) {
  // implementation
}
```

## 🎯 Reasoning Behind These Standards

### Type vs Interface
- **Consistency**: Using `type` for all definitions creates uniform patterns
- **Flexibility**: Types support union types, intersection types, and computed types more naturally
- **Composition**: Intersection types (`&`) are more explicit than interface extension
- **Immutability**: Types feel more like immutable definitions vs extendable interfaces
- **Modern TypeScript**: Aligns with current TypeScript best practices and community standards

### Timestamp Conventions
- **Data Integrity**: Firebase Timestamps preserve precision and enable efficient querying
- **Consistency**: `time` prefix creates uniform field naming across all data structures
- **Avoid Duplication**: Metadata pattern handles standard timestamps, custom fields for business logic
- **Performance**: Proper timestamps enable indexed queries and real-time ordering
- **Cross-Platform**: Server timestamps work consistently across web, mobile, and server environments

### Function Standards
- **Consistency**: Uniform function declaration style across the entire codebase
- **Readability**: Arrow functions clearly indicate function expressions with reduced visual noise
- **Modern JavaScript/TypeScript**: Aligns with modern ES6+ conventions and popular style guides
- **Developer Experience**: Better IDE support and easier code searching/refactoring

## 🔍 Enforcement

### Linting Rules
Consider adding these ESLint rules to enforce these standards:

```json
{
  "rules": {
    "prefer-arrow-callback": "error",
    "func-style": ["error", "expression"],
    "arrow-body-style": ["error", "as-needed"],
    "prefer-const": "error",
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/prefer-union-types": "error"
  }
}
```

### Code Reviews
During code reviews, ensure:
- All data structures use `type` instead of `interface`
- Type composition uses intersection types (`&`) over interface extension
- All timestamp fields use Firebase `Timestamp` and follow `time` prefix naming
- Standard timestamps (`timeCreated`, `timeUpdated`) use metadata pattern
- All exported functions use `const` arrow function syntax
- Single-return functions omit unnecessary brackets
- Complex object returns use parentheses instead of explicit return
- Consistency is maintained across all new code

### Examples Integration
All examples in the `/examples` directory follow these standards and serve as reference implementations for:
- React components with hooks
- Cloud Functions
- Utility functions
- Type definitions and handlers

## 📚 Additional Resources

- [MDN Arrow Functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
- [TypeScript Function Types](https://www.typescriptlang.org/docs/handbook/2/functions.html)
- [ESLint Arrow Function Rules](https://eslint.org/docs/rules/arrow-body-style)

---

**Note**: These standards apply to all new code. When modifying existing code, update function declarations to match these standards when practical and doesn't conflict with the scope of the change.