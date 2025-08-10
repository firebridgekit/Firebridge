const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  getIdToken: jest.fn().mockResolvedValue('mock-token'),
}

const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: jest.fn((callback) => {
    callback(mockUser)
    return jest.fn() // unsubscribe function
  }),
  signInAnonymously: jest.fn().mockResolvedValue({ user: mockUser }),
  signOut: jest.fn().mockResolvedValue(undefined),
}

module.exports = jest.fn(() => mockAuth)