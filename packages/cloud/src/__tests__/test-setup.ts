import functionsTest from 'firebase-functions-test';
import * as admin from 'firebase-admin';

// Initialize firebase-functions-test in offline mode
export const test = functionsTest();

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  admin.initializeApp();
}

// Global test utilities that work with firebase-functions-test
global.createMockTimestamp = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return admin.firestore.Timestamp.fromDate(dateObj);
};

global.createMockEvent = (time: string | Date, count = 1, value = 0) => ({
  time: createMockTimestamp(time),
  count,
  value,
});

// Clean up function to be called after all tests
export const cleanup = () => {
  test.cleanup();
};

// Export wrapped functions for testing
export const wrap = test.wrap;