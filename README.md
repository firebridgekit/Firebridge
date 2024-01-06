# Firebridge

### 💡 Find the full docs at [firebridge.dev](https://firebridge.dev)

Firebridge is a set of patterns that will help you build powerful and consistent developer experiences with Firebase on React Web and Native.

- 🤌 Just the right amount of abstraction.
- ⚛️ Built natively with React hooks to manage state.
- 🕹️ Minimal boilerplate — take back full control where you need it.
- 🔌 Strong integration of TypeScript types for functions, data, and more.
- ☁️ Simplified server logic for Callables, batch execution, and more.
- 📱 High consistency between `react` and `react-native`.
- ✅ Reliance on well adopted libraries:
  - 🔥 [`react-firebase-hooks`](https://www.npmjs.com/package/react-firebase-hooks) for web.
  - ☄️ [`react-native-firebase`](https://rnfirebase.io/) for native.

## 1 — Define Realtime Connections

Firebridge mixes the power of Firebase's Cloud Firestore and React hooks to help you express realtime platform logic in a very simple format. We give you a simple format for defining typed realtime connections to Cloud Firestore.

```tsx
import { doc } from 'firebase/firestore'
import { useDocument } from '@firebridge/web'

const useBook = (bookId: string) =>
  // Books are stored at `books/{bookId}`.
  useDocument<Book>(doc(firestore, 'books', bookId))
```

<Note>
  This format might look familiar. Under the hood on `@firebridge/web`, we're
  using
  [`react-firebase-hooks`](https://www.npmjs.com/package/react-firebase-hooks)
  with a few samll extensions on the syntax. We've also implemented the same
  hooks for `@firebridge/native`.
</Note>

Since we assume that all connections will be done on behalf of a user, we can easily perform user-specitic queries. This hook will maintain a realtime connection with the current user's review for the book.

```tsx
const useOwnReviewForBook = (bookId: string) =>
  useDocument<BookReview>(uid =>
    // Reviews are stored at `books/{bookId}/reviews/{userId}`.
    doc(firestore, 'books', bookId, 'reviews', uid),
  )
```

To shake things up, let's maintain a realtime connection with the book's three most recent reviews. Since we're creating reviews on the server, we can ask Firebridge to automatically include metadata like `timeCreated` in the documents. This makes sorting by creation date very easy.

```ts
import { query, collection, orderBy, limit } from 'firebase/firestore'
import { useCollection } from '@firebridge/web'

const useRecentReviewsForBook = (bookId: string, maxCount = 3) =>
  useCollection<BookReview>(
    query(
      collection(firestore, 'books', bookId, 'reviews'),
      // Metadata can be included automatically by Firebridge.
      orderBy('metadata.timeCreated', 'desc'),
      limit(maxCount),
    ),
  )
```

## 2 — Cloud Callables

Sometimes we need to run an operation on the server before a write can occur. Let's say when a user posts a review, we want to make sure that the review doesn't contain any explicit content.

First, we can create a utility to save reviews to the database. We'll use the `firestoreSet` utility from `@firebridge/cloud` to create a function that will save the review to the database. We'll ask it to include metadata like a FirestoreTimestamp for the `timeCreated` to make querying easy.

```ts
// ... in our Cloud Functions project.
import { firestoreSet } from '@firebridge/cloud'

const setReview = firestoreSet<BookReview>(
  // We can simply use the bookId from the review to build the path.
  ({ data }) => `books/${data.bookId}/reviews`,
  // This will automatically include metadata like `timeCreated`.
  { addMetadata: true },
)
```

Now, we can write our callable function. In Firebase, a callable function will include the user's authentication information in the request. We can use this to make sure we post the review on behalf of the correct user.

```ts
// ... in our Cloud Functions project.
import { callable, onCall } from '@firebridge/cloud'

export const onReviewBook = onCall(
  callable<OnReviewBookBody, OnReviewBookResult>({
    action: async (review, { auth }) => {
      // Check for explicit content in the body of the review.
      const isExplicit = await checkForExplicitContent(review.body)
      if (isExplicit) {
        return { success: false, message: 'Explicit content detected.' }
      }

      // Post the review.
      await setReview(auth.uid, review)
      return { success: true }
    },
  }),
)
```

Using the callable on the client side is as simple as using the `useCallable` hook. We can even include the same type definitions so that the request and response are typed correctly.

```ts
// ... back on the client side.
import { useCallable } from '@firebridge/web'

const useOnReviewBook = useCallable<OnReviewBookBody, OnReviewBookResult>(
  functions,
  'onReviewBook',
)

// Now, we can use this hook to post reviews.
// For example:
const onReviewBook = useOnReviewBook()
onReviewBook({ bookId, body: 'This book is great!' })
```

## 3 — Frontend Experience

Now, we can bring it all together using our hooks and callable function to build a book page with just the right amount of abstraction. Everything is typesafe, and it's easy to understand what's going on just from reading the code. What's more, we haven't ruled out the full power of Firebase. If we need to, we can always drop down to the Firebase SDK to perform more complex operations.

```tsx
const BookPage: FC<BookPageProps> = ({ bookId }) => {
  // Realtime Data
  const book = useBook(bookId)
  const ownReview = useOwnReviewForBook(bookId)
  const recentReviews = useRecentReviewsForBook(bookId)

  // Review Submission
  const onReviewBook = useOnReviewBook()
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // If the user has already reviewed the book, populate the draft.
    if (ownReview) setDraft(ownReview.body)
  }, [ownReview])

  const handleSubmitReview = async (body: string) => {
    // Post the review.
    setIsLoading(true)
    const { success, message } = await onReviewBook({ bookId, body })
    setIsLoading(false)
    if (!success) alert(message)
  }

  return isLoading ? (
    <div>Loading...</div>
  ) : (
    <div>
      <h1>{book?.title}</h1>
      <p>{book?.description}</p>

      <h2>Your Review</h2>
      <textarea type="text" onChange={e => setDraft(e.target.value)} />
      <button onClick={() => handleSubmitReview(draft)}>Submit</button>

      <h2>Recent Reviews</h2>
      <ul>
        {recentReviews?.map(({ id, body }) => (
          <li key={id}>{body}</li>
        ))}
      </ul>
    </div>
  )
}
```

What's more, when we go to writing our native app, the code will be alost entirely the same. Once you get started with these patterns, you'll be able to build powerful and consistent developer experiences with Firebase on React Web and Native.
