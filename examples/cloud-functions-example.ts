import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import {
  callableV2,
  firestoreGet,
  firestoreGetDocs,
  firestoreSet,
  firestoreUpdate,
  firestoreDelete,
  executeFirestoreBatch,
  incrementMetric,
  metric,
  hydrateTimestamp,
  timestampToDate,
  readSnapshot,
  readQuerySnapshot,
  sumBy,
  firestoreAdd,
  firestoreMerge,
  WithId,
} from '@firebridge/cloud'
import { z } from 'zod'
import { EditorialMetadata } from './types-usage-example'

// Initialize Firebase Admin
const app = initializeApp()
const db = getFirestore(app)

// Define types for your data
type UserProfile = {
  name: string
  email: string
  // We always store times as timestamps in Firestore to preserve query filters
  // and ordering. They are prefixed with "time..." for clarity.
  timeLastLoggedIn?: Timestamp
}

type Post = {
  title: string
  content: string
  published: boolean

  // IDs of other entities are stored as strings in Firestore.
  // They are prefixed with "id..." for clarity.
  authorId: string

  // The editorial metadata contains information like timeCreated and
  // timeUpdated. It's managed by the firebridge actions and is configured
  // by the `addMetadata` flag.
} & EditorialMetadata<Timestamp>

// Callable request and response types are often defined in a types module,
// shared by the client and server apps.
type CreatePostRequest = { title: string; content: string }
// It's common to return the created entity in the response.
type CreatePostResponse = WithId<Post>

// Example 1: Using Firestore Actions

// We can create functions to perform common actions on Firestore documents.
const addUserProfile = firestoreAdd<UserProfile>('users')
const deleteUser = firestoreDelete('users')
const getUserProfile = firestoreGet<UserProfile>('users')
const mergeUserProfile = firestoreMerge<UserProfile>('users')
const setUserProfile = firestoreSet<UserProfile>('users')
const updateUserProfile = firestoreUpdate<Partial<UserProfile>>('users')

// Example usage of Firestore actions
const manageUserProfile = async (userId: string) => {
  // Get a user profile
  const profile = await getUserProfile(userId)
  console.log('User profile:', profile)

  // Update user profile
  await updateUserProfile(userId, {
    timeLastLoggedIn: Timestamp.now(),
  })

  // Set a new user profile (timeCreated/timeUpdated handled by metadata)
  await setUserProfile(userId, {
    name: 'John Doe',
    email: 'john@example.com',
    timeLastLoggedIn: Timestamp.now(),
  })
}

// If we want to add metadata to the document, we can pass the `addMetadata` flag.
const addPost = firestoreAdd<Post>('posts', { addMetadata: true })
const updatePost = firestoreUpdate<Partial<Post>>('posts', {
  addMetadata: true,
})
const mergePost = firestoreMerge<Post>('posts', { addMetadata: true })
// Now when we create a post, the metadata will be added to the document.
const addBlankPost = async () => {
  const post = await addPost({ title: '', content: '', published: false })
  // The metadata will have been created by the firestoreAdd action.
  const timeCreated = post.metadata.timeCreated
  console.log('Post created:', timestampToDate(timeCreated))
}

// Example 2: Checkout function demonstrating metric count and value
const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
    }),
  ),
})

type CheckoutRequest = z.infer<typeof checkoutSchema>

type CheckoutResponse = {
  orderId: string
  totalItems: number
  totalAmount: number
}

export const processCheckout = callableV2<CheckoutRequest, CheckoutResponse>({
  validation: checkoutSchema,
  scope: 'orders:create',
  action: async ({ data, auth }) => {
    const userId = auth.uid
    const orderId = db.collection('orders').doc().id

    // Calculate totals
    const totalItems = sumBy(data.items, 'quantity')
    const totalAmount = sumBy(data.items, item => item.quantity * item.price)

    // Create the order
    await firestoreSet<any>('orders')(orderId, {
      userId,
      items: data.items,
      totalItems,
      totalAmount,
      timeOrdered: Timestamp.now(),
      status: 'pending',
    })

    // Track the checkout metric with meaningful count and value
    // count = number of items purchased, value = total dollar amount
    await incrementMetric('user', 'checkout', userId, {
      count: totalItems,
      value: totalAmount,
    })

    return {
      orderId,
      totalItems,
      totalAmount,
    }
  },
})

// Example 3: More complex callable function with custom permission check
const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
})

export const createPost = callableV2<CreatePostRequest, { postId: string }>({
  validation: createPostSchema,
  checkHasPermission: (permissions, data) => {
    // Custom permission logic
    return permissions.canCreatePosts && data.title.length <= 100
  },
  action: async ({ data, auth }) => {
    const postId = db.collection('posts').doc().id

    const newPost: Post = {
      ...data,
      authorId: auth.uid,
      published: false,
      timePublished: null,
    }

    // Use Firestore action to create the post
    const setPost = firestoreSet<Post>('posts')
    await setPost(postId, newPost)

    // Track metrics
    await incrementMetric('post', 'created', auth.uid)

    return { postId }
  },
})

// Example 4: Using batch operations
export const publishMultiplePosts = callableV2<
  { postIds: string[] },
  { published: number }
>({
  scope: 'posts:publish',
  action: async ({ data }) => {
    const operations = data.postIds.map(postId => ({
      type: 'update' as const,
      ref: db.collection('posts').doc(postId),
      data: {
        published: true,
        timePublished: Timestamp.now(),
      },
    }))

    // Execute all updates in batches
    await executeFirestoreBatch(operations)

    // Track metrics for each post
    await incrementMetric('post', 'published', {
      count: data.postIds.length,
      value: data.postIds.length,
    })

    return { published: data.postIds.length }
  },
})

// Example 5: Reading user analytics metrics from entity summaries
export const getUserAnalytics = callableV2<
  { userId: string },
  {
    postsCreated: number
    postsPublished: number
    profileUpdates: number
    lastActivity: string | null
  }
>({
  scope: 'analytics:read',
  action: async ({ data }) => {
    // Read metric entity summaries for the user
    // Each metric tracks a different user action
    const [postsCreatedSummary, postsPublishedSummary, profileUpdatesSummary] =
      await Promise.all([
        metric('user', 'postCreated').entity(data.userId).get(),
        metric('user', 'postPublished').entity(data.userId).get(),
        metric('user', 'profileUpdated').entity(data.userId).get(),
      ])

    // Extract totals from the summaries (null if metric doesn't exist for user)
    const postsCreated = postsCreatedSummary?.count || 0
    const postsPublished = postsPublishedSummary?.count || 0
    const profileUpdates = profileUpdatesSummary?.count || 0

    return { postsCreated, postsPublished, profileUpdates }
  },
})

// Example 6: Working with timestamps
export const processUserData = callableV2<
  { userData: UserProfile },
  { processed: boolean }
>({
  action: async ({ data }) => {
    // Hydrate timestamps from serialized data
    const timeCreated = hydrateTimestamp(data.userData.timeCreated)
    const timeLastLogin = hydrateTimestamp(data.userData.timeLastLogin)

    // Convert to regular Date objects for display
    const createdDate = timestampToDate(timeCreated)
    const loginDate = timestampToDate(timeLastLogin)

    console.log('User created:', createdDate)
    console.log('Last login:', loginDate)

    return { processed: true }
  },
})

// Example 7: Reading snapshots directly
const readUserPosts = async (userId: string) => {
  // Get a single document
  const userDoc = await db.collection('users').doc(userId).get()
  const user = readSnapshot<UserProfile>(userDoc)

  // Get a query snapshot
  const postsQuery = await db
    .collection('posts')
    .where('authorId', '==', userId)
    .get()
  const posts = readQuerySnapshot<Post>(postsQuery)

  return { user, posts }
}

// Example 8: Using dynamic collection paths
const getPostComments = (postId: string) =>
  firestoreGetDocs<{ content: string; authorId: string }>(
    // Dynamic path based on arguments
    (args: { postId: string }) => `posts/${args.postId}/comments`,
  )({ postId })

const getPostWithComments = async (postId: string) => {
  const getPost = firestoreGet<Post>('posts')

  const post = await getPost(postId)
  const comments = await getPostComments(postId)

  return { post, comments }
}
