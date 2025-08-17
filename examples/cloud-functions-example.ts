import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { 
  callableV2,
  firestoreGet,
  firestoreSet,
  firestoreUpdate,
  firestoreDelete,
  executeFirestoreBatch,
  executeFirestoreParallel,
  incrementMetric,
  updateMetric,
  metric,
  hydrateTimestamp,
  timestampToDate,
  readSnapshot,
  readQuerySnapshot
} from '@firebridge/cloud';
import { z } from 'zod';

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore(app);

// Define types for your data
type UserProfile = {
  name: string;
  email: string;
  timeLastLoggedIn?: Timestamp;
};

type Post = {
  title: string;
  content: string;
  authorId: string;
  published: boolean;
  timePublished?: Timestamp;
};

type CreatePostRequest = {
  title: string;
  content: string;
}

// Example 1: Using Firestore Actions
const getUserProfile = firestoreGet<UserProfile>('users');
const setUserProfile = firestoreSet<UserProfile>('users');
const updateUserProfile = firestoreUpdate<Partial<UserProfile>>('users');
const deleteUser = firestoreDelete('users');

// Example usage of Firestore actions
const manageUserProfile = async (userId: string) => {
  // Get a user profile
  const profile = await getUserProfile(userId);
  console.log('User profile:', profile);

  // Update user profile
  await updateUserProfile(userId, {
    timeLastLoggedIn: Timestamp.now()
  });

  // Set a new user profile (timeCreated/timeUpdated handled by metadata)
  await setUserProfile(userId, {
    name: 'John Doe',
    email: 'john@example.com',
    timeLastLoggedIn: Timestamp.now()
  });
}

// Example 2: Checkout function demonstrating metric count and value
const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive()
  }))
});

type CheckoutRequest = z.infer<typeof checkoutSchema>;

export const processCheckout = callableV2<CheckoutRequest, { 
  orderId: string;
  totalItems: number;
  totalAmount: number;
}>({
  validation: checkoutSchema,
  scope: 'orders:create',
  action: async ({ data, auth }) => {
    const userId = auth.uid;
    const orderId = db.collection('orders').doc().id;
    
    // Calculate totals
    const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Create the order
    await firestoreSet<any>('orders')(orderId, {
      userId,
      items: data.items,
      totalItems,
      totalAmount,
      timeOrdered: Timestamp.now(),
      status: 'pending'
    });
    
    // Track the checkout metric with meaningful count and value
    // count = number of items purchased, value = total dollar amount
    await incrementMetric('user', 'checkout', userId, {
      count: totalItems,
      value: totalAmount
    });
    
    return { 
      orderId,
      totalItems,
      totalAmount
    };
  }
});

// Example 3: More complex callable function with custom permission check
const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1)
});

export const createPost = callableV2<CreatePostRequest, { postId: string }>({
  validation: createPostSchema,
  checkHasPermission: (permissions, data) => {
    // Custom permission logic
    return permissions.canCreatePosts && data.title.length <= 100;
  },
  action: async ({ data, auth }) => {
    const postId = db.collection('posts').doc().id;
    
    const newPost: Post = {
      ...data,
      authorId: auth.uid,
      published: false,
      timePublished: null
    };
    
    // Use Firestore action to create the post
    const setPost = firestoreSet<Post>('posts');
    await setPost(postId, newPost);
    
    // Track metrics
    await incrementMetric('post', 'created', auth.uid, {
      count: 1,
      value: 1
    });
    
    return { postId };
  }
});

// Example 4: Using batch operations
export const publishMultiplePosts = callableV2<{ postIds: string[] }, { published: number }>({
  scope: 'posts:publish',
  action: async ({ data, auth }) => {
    const operations = data.postIds.map(postId => ({
      type: 'update' as const,
      ref: db.collection('posts').doc(postId),
      data: {
        published: true,
        timePublished: Timestamp.now()
      }
    }));
    
    // Execute all updates in batches
    await executeFirestoreBatch(operations);
    
    // Track metrics for each post
    const metricOperations = data.postIds.map(postId => 
      incrementMetric('post', 'published', postId, {
        count: 1,
        value: 1
      })
    );
    
    // Execute metrics in parallel
    await executeFirestoreParallel(metricOperations);
    
    return { published: data.postIds.length };
  }
});

// Example 5: Reading user analytics metrics from entity summaries
export const getUserAnalytics = callableV2<{ userId: string }, {
  postsCreated: number;
  postsPublished: number;
  profileUpdates: number;
  lastActivity: string | null;
}>({
  scope: 'analytics:read',
  action: async ({ data }) => {
    // Read metric entity summaries for the user
    // Each metric tracks a different user action
    const [postsCreatedSummary, postsPublishedSummary, profileUpdatesSummary] = await Promise.all([
      metric('user', 'posts_created').entity(data.userId).get(),
      metric('user', 'posts_published').entity(data.userId).get(),
      metric('user', 'profile_updates').entity(data.userId).get()
    ]);
    
    // Extract totals from the summaries (null if metric doesn't exist for user)
    const postsCreated = postsCreatedSummary?.count || 0;
    const postsPublished = postsPublishedSummary?.count || 0;
    const profileUpdates = profileUpdatesSummary?.count || 0;
    
    // Find the most recent activity
    const lastActivityTimestamp = [
      postsCreatedSummary?.lastUpdated,
      postsPublishedSummary?.lastUpdated,
      profileUpdatesSummary?.lastUpdated
    ]
      .filter(Boolean)
      .sort((a, b) => b.seconds - a.seconds)[0];
    
    return {
      postsCreated,
      postsPublished,
      profileUpdates,
      lastActivity: lastActivityTimestamp ? lastActivityTimestamp.toDate().toISOString() : null
    };
  }
});

// Example 6: Working with timestamps
export const processUserData = callableV2<{ userData: any }, { processed: boolean }>({
  action: async ({ data }) => {
    // Hydrate timestamps from serialized data
    const timeCreated = hydrateTimestamp(data.userData.timeCreated);
    const timeLastLogin = hydrateTimestamp(data.userData.timeLastLogin);
    
    // Convert to regular Date objects for display
    const createdDate = timestampToDate(timeCreated);
    const loginDate = timestampToDate(timeLastLogin);
    
    console.log('User created:', createdDate);
    console.log('Last login:', loginDate);
    
    return { processed: true };
  }
});

// Example 7: Reading snapshots directly
const readUserPosts = async (userId: string) => {
  // Get a single document
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = readSnapshot<UserProfile>(userDoc);
  
  // Get a query snapshot
  const postsQuery = await db.collection('posts')
    .where('authorId', '==', userId)
    .get();
  const posts = readQuerySnapshot<Post>(postsQuery);
  
  return { user: userData, posts };
}

// Example 8: Using dynamic collection paths
const getPostComments = firestoreGet<{ content: string; authorId: string }>(
  // Dynamic path based on arguments
  (args: { postId: string }) => `posts/${args.postId}/comments`
);

const getPostWithComments = async (postId: string) => {
  const getPost = firestoreGet<Post>('posts');
  
  const post = await getPost(postId);
  const comment = await getPostComments('comment1', { postId });
  
  return { post, comment };
}