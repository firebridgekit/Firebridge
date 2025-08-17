import React from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, collection, query, where, orderBy } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import {
  FirebridgeProvider,
  useFirebridge,
  useDocument,
  useCollection,
  useCallable,
  useCallableResponse,
  WithId
} from '@firebridge/web';

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase config
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Define types for your data
interface UserProfile {
  name: string;
  email: string;
  createdAt: any;
}

interface Post {
  title: string;
  content: string;
  userId: string;
  publishedAt: any;
  published: boolean;
}

interface UpdateProfileResponse {
  success: boolean;
  message: string;
}

interface AnalyticsData {
  pageViews: number;
  postsCount: number;
  lastActive: any;
}

// Example component using Firebridge hooks
const UserProfile = ({ userId }: { userId: string }) => {
  const { user, signOut } = useFirebridge();
  
  // Use useDocument to get a single document
  // The function receives (uid, ...pathParts) where uid is the current user's ID
  const userProfile = useDocument<UserProfile>(
    (uid) => doc(db, 'users', uid),
    [], // No additional path parts needed
    {
      onError: (error) => console.error('Error loading profile:', error)
    }
  );

  // Use useCollection to get multiple documents with a query
  const userPosts = useCollection<Post>(
    (uid) => query(
      collection(db, 'posts'),
      where('userId', '==', uid),
      where('published', '==', true),
      orderBy('publishedAt', 'desc')
    ),
    [], // No additional path parts needed
    {
      onError: (error) => console.error('Error loading posts:', error)
    }
  );

  // Use useCallable for calling cloud functions that perform actions
  const updateProfile = useCallable<
    { name: string; email?: string }, 
    UpdateProfileResponse
  >(functions, 'updateUserProfile');

  // Use useCallableResponse for functions that return data immediately on mount
  const userAnalytics = useCallableResponse<AnalyticsData>(
    functions,
    'getUserAnalytics',
    { userId: user?.uid }
  );

  const handleUpdateProfile = async () => {
    try {
      const response = await updateProfile({ 
        name: 'Updated Name',
        email: 'new@email.com'
      });
      console.log('Profile updated:', response);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  // Show loading state while user profile is being fetched
  if (userProfile === undefined) {
    return <div>Loading profile...</div>;
  }

  // Show message if user doesn't exist
  if (userProfile === null) {
    return <div>User profile not found</div>;
  }

  return (
    <div>
      <h1>Welcome, {userProfile.name}</h1>
      <p>Email: {userProfile.email}</p>
      <p>Member since: {userProfile.createdAt?.toDate?.()?.toLocaleDateString()}</p>
      
      <button onClick={handleUpdateProfile}>
        Update Profile
      </button>
      
      {userAnalytics && (
        <div>
          <h3>Your Analytics</h3>
          <p>Page Views: {userAnalytics.pageViews}</p>
          <p>Posts Count: {userAnalytics.postsCount}</p>
          <p>Last Active: {userAnalytics.lastActive?.toDate?.()?.toLocaleDateString()}</p>
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
              <small>Published: {post.publishedAt?.toDate?.()?.toLocaleDateString()}</small>
            </li>
          ))}
        </ul>
      )}
      
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

// Example component showing dynamic path parts
const TopicPosts = ({ topicId }: { topicId?: string }) => {
  // Use path parts to handle dynamic paths
  const topicPosts = useCollection<Post>(
    (_uid, topicId) => query(
      collection(db, 'topics', topicId, 'posts'),
      where('published', '==', true),
      orderBy('publishedAt', 'desc')
    ),
    [topicId], // This will prevent fetching if topicId is undefined
    {
      onError: (error) => console.error('Error loading topic posts:', error)
    }
  );

  if (!topicId) {
    return <div>Please select a topic</div>;
  }

  if (topicPosts === undefined) {
    return <div>Loading topic posts...</div>;
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
  );
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
        print: console.log
      }}
    >
      <div className="App">
        <UserProfile userId="user123" />
        <TopicPosts topicId="react-tips" />
      </div>
    </FirebridgeProvider>
  );
}

export default App;