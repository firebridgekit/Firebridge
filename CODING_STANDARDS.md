# Firebridge Coding Standards

This document outlines the coding standards and conventions used throughout the Firebridge project.

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

### Consistency
- Uniform function declaration style across the entire codebase
- Easier to read and maintain when all functions follow the same pattern

### Readability
- Arrow functions clearly indicate function expressions
- Reduced visual noise with omitted unnecessary syntax
- More concise code for simple operations

### Modern JavaScript/TypeScript
- Aligns with modern ES6+ conventions
- Better lexical `this` binding (though less relevant with TypeScript)
- Consistent with popular style guides (Airbnb, Prettier defaults)

### Developer Experience
- IDE autocomplete and refactoring tools work better with consistent patterns
- Easier to grep/search for function exports
- Less cognitive overhead when reading code

## 🔍 Enforcement

### Linting Rules
Consider adding these ESLint rules to enforce these standards:

```json
{
  "rules": {
    "prefer-arrow-callback": "error",
    "func-style": ["error", "expression"],
    "arrow-body-style": ["error", "as-needed"],
    "prefer-const": "error"
  }
}
```

### Code Reviews
During code reviews, ensure:
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