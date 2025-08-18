import React from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import {
  FirebridgeProvider,
  useFirebridge,
  useDocument,
  useCollection,
  useCallable,
  useCallableResponse,
  WithId,
  timestampToDate,
} from '@firebridge/web'

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase config
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app)

// Define types for your data
type UserProfile = {
  name: string
  email: string
  timeLastLoggedIn?: Timestamp
}

type Post = {
  title: string
  content: string
  userId: string
  timePublished: Timestamp
  published: boolean
}

type UpdateProfileResponse = {
  success: boolean
  message: string
}

type AnalyticsData = {
  pageViews: number
  postsCount: number
  timeLastActive: Timestamp
}

// Example component using Firebridge hooks
const UserProfile = () => {
  const { user, signOut } = useFirebridge()

  // Use useDocument to get a single document
  // The function receives (uid, ...pathParts) where uid is the current user's ID
  const userProfile = useDocument<UserProfile>(uid => doc(db, 'users', uid))

  // Use useCollection to get multiple documents with a query
  const userPosts = useCollection<Post>(uid =>
    query(
      collection(db, 'posts'),
      where('userId', '==', uid),
      where('published', '==', true),
      orderBy('timePublished', 'desc'),
    ),
  )

  // Use useCallable for calling cloud functions that perform actions
  const updateProfile = useCallable<
    { name: string; email?: string },
    UpdateProfileResponse
  >(functions, 'updateUserProfile')

  // Use useCallableResponse for functions that return data immediately on mount
  const userAnalytics = useCallableResponse<AnalyticsData>(
    functions,
    'getUserAnalytics',
    { userId: user?.uid },
  )

  const handleUpdateProfile = async ({
    name,
    email,
  }: {
    name: string
    email?: string
  }) => {
    try {
      const response = await updateProfile({ name, email })
      console.log('Profile updated:', response)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  // Show loading state while user profile is being fetched
  if (userProfile === undefined) {
    return <div>Loading profile...</div>
  }

  // Show message if user doesn't exist
  if (userProfile === null) {
    return <div>User profile not found</div>
  }

  return (
    <div>
      <h1>Welcome, {userProfile.name}</h1>
      <p>Email: {userProfile.email}</p>
      <p>
        Last login:{' '}
        {timestampToDate(userProfile.timeLastLoggedIn)?.toLocaleDateString()}
      </p>

      <button onClick={handleUpdateProfile}>Update Profile</button>

      {userAnalytics && (
        <div>
          <h3>Your Analytics</h3>
          <p>Page Views: {userAnalytics.pageViews}</p>
          <p>Posts Count: {userAnalytics.postsCount}</p>
          <p>
            Last Active:{' '}
            {timestampToDate(
              userAnalytics.timeLastActive,
            )?.toLocaleDateString()}
          </p>
        </div>
      )}

      <h2>Your Posts</h2>
      {userPosts === undefined ? (
        <div>Loading posts...</div>
      ) : userPosts.length === 0 ? (
        <div>No posts found</div>
      ) : (
        <ul>
          {userPosts.map((post: WithId<Post>) => (
            <li key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              <small>
                Published:{' '}
                {timestampToDate(post.timePublished)?.toLocaleDateString()}
              </small>
            </li>
          ))}
        </ul>
      )}

      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

// Example component showing dynamic path parts
const TopicPosts = ({ topicId }: { topicId?: string }) => {
  // Use path parts to handle dynamic paths
  const topicPosts = useCollection<Post>(
    (_uid, topicId) =>
      query(
        collection(db, 'topics', topicId, 'posts'),
        where('published', '==', true),
        orderBy('timePublished', 'desc'),
      ),
    // This will prevent fetching if topicId is undefined
    // It will also rebuild the query when topicId changes
    [topicId],
  )

  if (!topicId) {
    return <div>Please select a topic</div>
  }

  if (topicPosts === undefined) {
    return <div>Loading topic posts...</div>
  }

  return (
    <div>
      <h2>Posts in Topic {topicId}</h2>
      {topicPosts.length === 0 ? (
        <div>No posts in this topic</div>
      ) : (
        <ul>
          {topicPosts.map((post: WithId<Post>) => (
            <li key={post.id}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Main App component with FirebridgeProvider
const App = () => {
  return (
    <FirebridgeProvider
      auth={auth}
      allowAnonymousSignIn={true}
      log={{
        error: console.error,
        warn: console.warn,
        debug: console.debug,
        print: console.log,
      }}>
      <div className="App">
        <UserProfile />
        <TopicPosts topicId="react-tips" />
      </div>
    </FirebridgeProvider>
  )
}

export default App
