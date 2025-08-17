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
  createdAt: Date;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
};

// ❌ Avoid - interface
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
```

### ✅ Intersection Types for Composition

Use intersection types (`&`) for combining types:

```typescript
// ✅ Correct - intersection types
export type UserWithMetadata = User & {
  createdAt: Date;
  updatedAt: Date;
};

export type Product = Sellable & {
  category: string;
  stockQuantity: number;
};

// ❌ Avoid - interface extension
export interface UserWithMetadata extends User {
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: new Date(),
  updatedAt: new Date()
});

// ❌ Avoid - explicit return statement
export const createUser = (data: UserInput) => {
  return {
    id: generateId(),
    name: data.name,
    email: data.email,
    createdAt: new Date(),
    updatedAt: new Date()
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