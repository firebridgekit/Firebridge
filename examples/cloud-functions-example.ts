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

type UpdateProfileRequest = {
  name?: string;
  email?: string;
}

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

// Example 2: Using Callable Functions with validation and permissions
const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional()
});

export const updateProfile = callableV2<UpdateProfileRequest, { success: boolean }>({
  validation: updateProfileSchema,
  scope: 'profile:update', // Required permission
  action: async ({ data, auth }) => {
    const userId = auth.uid;
    
    // Update the user profile
    await updateUserProfile(userId, data);
    
    // Track the metric
    await incrementMetric('user', 'profile_update', userId, {
      count: 1,
      value: 1
    });
    
    return { success: true };
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

// Example 5: Working with metrics
export const getUserAnalytics = callableV2<{ userId: string }, {
  postsCreated: number;
  postsPublished: number;
  profileUpdates: number;
}>({
  scope: 'analytics:read',
  action: async ({ data }) => {
    // Update aggregated metrics
    await updateMetric('user', 'activity', data.userId, {
      hourly: { count: 1, value: 1 },
      daily: { count: 1, value: 1 }
    });
    
    // Here you would typically query your metrics collections
    // This is a simplified example
    return {
      postsCreated: 10,
      postsPublished: 8,
      profileUpdates: 3
    };
  }
});

// Example 6: Working with timestamps
export const processUserData = callableV2<{ userData: any }, { processed: boolean }>({
  action: async ({ data }) => {
    // Hydrate timestamps from serialized data
    const createdAt = hydrateTimestamp(data.userData.createdAt);
    const lastLogin = hydrateTimestamp(data.userData.lastLogin);
    
    // Convert to regular Date objects
    const createdDate = timestampToDate(createdAt);
    const loginDate = timestampToDate(lastLogin);
    
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