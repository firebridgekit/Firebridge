// Jest setup for React Native package
require('@testing-library/jest-dom')

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}))

// Global test setup can be added here if needed