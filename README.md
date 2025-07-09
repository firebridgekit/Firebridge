# Firebridge

<div align="center">
  <img src="docs/logo/light.svg" alt="Firebridge" width="200" />
  <p><strong>Powerful patterns for Firebase + React applications</strong></p>
  
  [![npm version](https://img.shields.io/npm/v/@firebridge/web.svg?style=flat)](https://www.npmjs.com/package/@firebridge/web)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

## What is Firebridge?

Firebridge provides just the right amount of abstraction for building Firebase applications with React (web & native). Slightly adapted cross-platform patterns from [`react-firebase-hooks`](https://github.com/firebase/firebase-js-sdk/tree/master/packages/react-firebase-hooks) for web and native, along with cloud functions and utilities.

## Key Features

- 🤌 **Just the right abstraction** - Not too much, not too little
- ⚛️ **React hooks for state** - Built natively with hooks
- 🕹️ **Minimal boilerplate** - Take back control when needed
- 🔌 **Full TypeScript** - Types for functions, data, and more
- ☁️ **Cloud utilities** - Simplified server logic
- 📱 **Cross-platform** - Consistent API for web & native

## Quick Start

```bash
# For React (web)
npm install @firebridge/web

# For React Native
npm install @firebridge/native

# For Cloud Functions (optional)
npm install @firebridge/cloud
```

Wrap your app with the Firebridge provider:

```tsx
// Web
import { FirebridgeProvider } from '@firebridge/web'
import { getAuth } from 'firebase/auth'

const App = () => (
  <FirebridgeProvider auth={auth}>{/* Your app */}</FirebridgeProvider>
)

// Native
import { FirebridgeProvider } from '@firebridge/native'

const App = () => <FirebridgeProvider>{/* Your app */}</FirebridgeProvider>
```

## Core Concepts

### Realtime Document Connection

**BEFORE:** 🙅 Vanilla Firebase:

```tsx
const [book, setBook] = useState(null)
const [loading, setLoading] = useState(true)

useEffect(() => {
  const unsubscribe = onSnapshot(doc(db, 'books', bookId), doc => {
    setBook(doc.data())
    setLoading(false)
  })
  return () => unsubscribe()
}, [bookId])
```

**AFTER:** 🙋🏼 With Firebridge

```tsx
const book = useDocument<Book>(doc(firestore, 'books', bookId))
```

### Dynamic User Paths

```tsx
// Automatically uses authenticated user ID
const profile = useDocument<Profile>(uid => doc(firestore, 'users', uid))

// User's reviews for a specific book
const review = useDocument<Review>(
  uid => doc(firestore, 'books', bookId, 'reviews', uid),
  [bookId], // Re-fetch when bookId changes
)
```

### Type-Safe Cloud Functions

```tsx
// Client
const reviewBook = useCallable<ReviewBody, ReviewResult>(
  functions,
  'reviewBook',
)

// Usage
const result = await reviewBook({
  bookId: '123',
  rating: 5,
  comment: 'Great book!',
})

// Server
export const reviewBook = onCall(
  callable<ReviewBody, ReviewResult>({
    action: async (data, { auth }) => {
      // Automatic auth, validation, and type safety
      await setReview(auth.uid, data)
      return { success: true }
    },
  }),
)
```

### Realtime Collections

```tsx
// Get the 10 most recent reviews, excluding your own
const recentReviews = useCollection<Review>(
  uid =>
    query(
      collection(firestore, 'books', bookId, 'reviews'),
      where('authorId', '!=', uid),
      orderBy('metadata.timeCreated', 'desc'),
      limit(10),
    ),
  [bookId],
)
```

## Getting Started

```bash
# Install
npm install @firebridge/web  # or @firebridge/native

# Wrap your app
import { FirebridgeProvider } from '@firebridge/web'

# Start using hooks
const user = useDocument(uid => doc(firestore, 'users', uid))
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

For bugs and feature requests, please create an issue.

## License

MIT © Mitchell Butler
