import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import {
  FirebridgeProvider,
  useFirebridge,
  useDocument,
  useCollection,
  useCallable,
  useDocumentState
} from '@firebridge/native';

// Define types for your data
type UserProfile = {
  name: string;
  email: string;
  createdAt: any;
  lastLogin?: any;
}

type Message = {
  content: string;
  senderId: string;
  timestamp: any;
  read: boolean;
}

type UpdateProfileRequest = {
  name?: string;
  email?: string;
}

type SendMessageRequest = {
  content: string;
  recipientId: string;
}

type UpdateProfileResponse = {
  success: boolean;
  message: string;
}

// Example component using Firebridge hooks
const UserProfile = () => {
  const { user, signOut, log } = useFirebridge();
  
  // Use useDocument to get the current user's profile
  const userProfile = useDocument<UserProfile>(
    (uid) => firestore().doc(`users/${uid}`)
  );

  // Use useCollection to get user's messages with real-time updates
  const messages = useCollection<Message>(
    (uid) => firestore()
      .collection(`users/${uid}/messages`)
      .orderBy('timestamp', 'desc')
      .limit(20)
  );

  // Use useDocumentState for local state management with Firestore sync
  const [profileState, setProfileState] = useDocumentState<UserProfile>(
    user?.uid ? firestore().doc(`users/${user.uid}`) : undefined,
    {
      name: '',
      email: '',
      createdAt: firestore.Timestamp.now()
    }
  );

  // Use useCallable for calling cloud functions
  const updateProfile = useCallable<UpdateProfileRequest, UpdateProfileResponse>('updateUserProfile');
  const sendMessage = useCallable<SendMessageRequest, { messageId: string }>('sendMessage');

  const handleUpdateProfile = async () => {
    try {
      const response = await updateProfile({
        name: 'Updated Name',
        email: 'updated@email.com'
      });
      
      Alert.alert('Success', response.message);
      log.print('Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      log.error('Profile update failed:', error);
    }
  };

  const handleSendMessage = async () => {
    try {
      const response = await sendMessage({
        content: 'Hello from React Native!',
        recipientId: 'recipient-user-id'
      });
      
      Alert.alert('Success', `Message sent with ID: ${response.messageId}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      log.error('Send message failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Success', 'Signed out successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
      log.error('Sign out failed:', error);
    }
  };

  // Update local state and sync with Firestore
  const handleUpdateLocalProfile = () => {
    setProfileState({
      ...profileState,
      name: 'Updated Local Name',
      lastLogin: firestore.Timestamp.now()
    });
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please sign in to continue</Text>
      </View>
    );
  }

  // Show loading state while profile is being fetched
  if (userProfile === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  // Show message if user profile doesn't exist
  if (userProfile === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>User profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Welcome, {userProfile.name}
      </Text>
      
      <Text style={{ fontSize: 16, marginBottom: 8 }}>
        Email: {userProfile.email}
      </Text>
      
      <Text style={{ fontSize: 16, marginBottom: 16 }}>
        Member since: {userProfile.createdAt?.toDate?.()?.toLocaleDateString()}
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 12,
          borderRadius: 8,
          marginBottom: 12
        }}
        onPress={handleUpdateProfile}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Update Profile
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#34C759',
          padding: 12,
          borderRadius: 8,
          marginBottom: 12
        }}
        onPress={handleSendMessage}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Send Test Message
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#FF9500',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16
        }}
        onPress={handleUpdateLocalProfile}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Update Local Profile State
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
        Local Profile State:
      </Text>
      <Text style={{ marginBottom: 8 }}>Name: {profileState.name}</Text>
      <Text style={{ marginBottom: 16 }}>Email: {profileState.email}</Text>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
        Recent Messages:
      </Text>
      {messages === undefined ? (
        <Text>Loading messages...</Text>
      ) : messages.length === 0 ? (
        <Text>No messages found</Text>
      ) : (
        messages.map((message) => (
          <View
            key={message.id}
            style={{
              backgroundColor: '#f0f0f0',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8
            }}
          >
            <Text style={{ fontWeight: 'bold' }}>From: {message.senderId}</Text>
            <Text style={{ marginTop: 4 }}>{message.content}</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {message.timestamp?.toDate?.()?.toLocaleString()}
            </Text>
            <Text style={{ fontSize: 12, color: message.read ? '#34C759' : '#FF3B30' }}>
              {message.read ? 'Read' : 'Unread'}
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity
        style={{
          backgroundColor: '#FF3B30',
          padding: 12,
          borderRadius: 8,
          marginTop: 20
        }}
        onPress={handleSignOut}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Example component showing dynamic path parts usage
const ChatRoom = ({ roomId }: { roomId?: string }) => {
  const { user } = useFirebridge();

  // Use path parts to handle dynamic collection paths
  const chatMessages = useCollection<Message>(
    (_uid, roomId) => firestore()
      .collection(`chatRooms/${roomId}/messages`)
      .orderBy('timestamp', 'desc')
      .limit(50),
    [roomId] // This will prevent fetching if roomId is undefined
  );

  if (!roomId) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Please select a chat room</Text>
      </View>
    );
  }

  if (chatMessages === undefined) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Loading chat messages...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
        Chat Room: {roomId}
      </Text>
      
      {chatMessages.length === 0 ? (
        <Text>No messages in this room</Text>
      ) : (
        chatMessages.map((message) => (
          <View
            key={message.id}
            style={{
              backgroundColor: message.senderId === user?.uid ? '#007AFF' : '#E5E5EA',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
              alignSelf: message.senderId === user?.uid ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            <Text style={{
              color: message.senderId === user?.uid ? 'white' : 'black'
            }}>
              {message.content}
            </Text>
            <Text style={{
              fontSize: 12,
              color: message.senderId === user?.uid ? '#E5E5EA' : '#666',
              marginTop: 4
            }}>
              {message.timestamp?.toDate?.()?.toLocaleTimeString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

// Main App component with FirebridgeProvider
const App = () => {
  return (
    <FirebridgeProvider
      allowAnonymousSignIn={true}
      log={{
        error: console.error,
        warn: console.warn,
        debug: console.debug,
        print: console.log
      }}
    >
      <View style={{ flex: 1 }}>
        <UserProfile />
        <ChatRoom roomId="general" />
      </View>
    </FirebridgeProvider>
  );
}

export default App;