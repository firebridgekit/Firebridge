import React from 'react'
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native'
import firestore from '@react-native-firebase/firestore'
import {
  FirebridgeProvider,
  useFirebridge,
  useDocument,
  useCollection,
  useCallable,
  useDocumentState,
  timestampToDate,
} from '@firebridge/native'

// Define types for your data
type UserProfile = {
  name: string
  email: string
  timeLastLoggedIn?: firestore.Timestamp
}

type Message = {
  content: string
  senderId: string
  timeSent: firestore.Timestamp
  read: boolean
}

type UpdateProfileRequest = {
  name?: string
  email?: string
}

type UpdateProfileResponse = {
  success: boolean
  message: string
}

type SendMessageRequest = {
  content: string
  recipientId: string
}

type SendMessageResponse = {
  messageId: string
}

// Example component using Firebridge hooks
const UserProfile = () => {
  const { user, signOut, log } = useFirebridge()

  // Use useDocument to get the current user's profile
  const userProfile = useDocument<UserProfile>(uid =>
    firestore().doc(`users/${uid}`),
  )

  // Use useCollection to get user's messages with real-time updates
  const messages = useCollection<Message>(uid =>
    firestore()
      .collection(`users/${uid}/messages`)
      .orderBy('timeSent', 'desc')
      .limit(20),
  )

  // Use useDocumentState for local state management with Firestore sync
  const [profileState, setProfileState] = useDocumentState<UserProfile>(
    user?.uid ? firestore().doc(`users/${user.uid}`) : undefined,
    {
      name: '',
      email: '',
      timeLastLoggedIn: firestore.Timestamp.now(),
    },
  )

  // Use useCallable for calling cloud functions
  const updateProfile = useCallable<
    UpdateProfileRequest,
    UpdateProfileResponse
  >('updateUserProfile')
  const sendMessage = useCallable<SendMessageRequest, SendMessageResponse>(
    'sendMessage',
  )

  const handleUpdateProfile = async () => {
    try {
      const response = await updateProfile({
        name: 'Updated Name',
        email: 'updated@email.com',
      })

      Alert.alert('Success', response.message)
      log.print('Profile updated successfully')
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile')
      log.error('Profile update failed:', error)
    }
  }

  const handleSendMessage = async () => {
    try {
      const response = await sendMessage({
        content: 'Hello from React Native!',
        recipientId: 'recipient-user-id',
      })

      Alert.alert('Success', `Message sent with ID: ${response.messageId}`)
    } catch (error) {
      Alert.alert('Error', 'Failed to send message')
      log.error('Send message failed:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      Alert.alert('Success', 'Signed out successfully')
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out')
      log.error('Sign out failed:', error)
    }
  }

  // Update local state and sync with Firestore
  const handleUpdateLocalProfile = () => {
    setProfileState({
      ...profileState,
      name: 'Updated Local Name',
      timeLastLoggedIn: firestore.Timestamp.now(),
    })
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please sign in to continue</Text>
      </View>
    )
  }

  // Show loading state while profile is being fetched
  if (userProfile === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading profile...</Text>
      </View>
    )
  }

  // Show message if user profile doesn't exist
  if (userProfile === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>User profile not found</Text>
      </View>
    )
  }

  return (
    <ScrollView>
      <Text>Welcome, {userProfile.name}</Text>
      <Text>Email: {userProfile.email}</Text>
      <Text>
        Last login:{' '}
        {timestampToDate(userProfile.timeLastLoggedIn)?.toLocaleDateString()}
      </Text>

      <TouchableOpacity onPress={handleUpdateProfile}>
        <Text>Update Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSendMessage}>
        <Text>Send Test Message</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleUpdateLocalProfile}>
        <Text>Update Local Profile State</Text>
      </TouchableOpacity>

      <Text>Local Profile State:</Text>
      <Text>Name: {profileState.name}</Text>
      <Text>Email: {profileState.email}</Text>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
        Recent Messages:
      </Text>
      {messages === undefined ? (
        <Text>Loading messages...</Text>
      ) : messages.length === 0 ? (
        <Text>No messages found</Text>
      ) : (
        messages.map(message => (
          <View
            key={message.id}
            style={{
              backgroundColor: '#f0f0f0',
              padding: 12,
              borderRadius: 8,
              marginBottom: 8,
            }}>
            <Text>From: {message.senderId}</Text>
            <Text>{message.content}</Text>
            <Text>{timestampToDate(message.timeSent)?.toLocaleString()}</Text>
            <Text>{message.read ? 'Read' : 'Unread'}</Text>
          </View>
        ))
      )}

      <TouchableOpacity onPress={handleSignOut}>
        <Text>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// Example component showing dynamic path parts usage
const ChatRoom = ({ roomId }: { roomId?: string }) => {
  // Use path parts to handle dynamic collection paths
  const chatMessages = useCollection<Message>(
    (_uid, roomId) =>
      firestore()
        .collection(`chatRooms/${roomId}/messages`)
        .orderBy('timeSent', 'desc')
        .limit(50),
    [roomId], // This will prevent fetching if roomId is undefined
  )

  if (!roomId) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Please select a chat room</Text>
      </View>
    )
  }

  if (chatMessages === undefined) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Loading chat messages...</Text>
      </View>
    )
  }

  return (
    <View>
      <Text>Chat Room: {roomId}</Text>

      {chatMessages.length === 0 ? (
        <Text>No messages in this room</Text>
      ) : (
        chatMessages.map(message => (
          <View key={message.id}>
            <Text>{message.content}</Text>
            <Text>
              {timestampToDate(message.timeSent)?.toLocaleTimeString()}
            </Text>
          </View>
        ))
      )}
    </View>
  )
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
        print: console.log,
      }}>
      <View style={{ flex: 1 }}>
        <UserProfile />
        <ChatRoom roomId="general" />
      </View>
    </FirebridgeProvider>
  )
}

export default App
