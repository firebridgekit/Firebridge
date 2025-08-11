import functionsTest from 'firebase-functions-test';
import * as admin from 'firebase-admin';

// Initialize firebase-functions-test in offline mode
export const test = functionsTest();

// Initialize Firebase Admin for testing
if (!admin.apps.length) {
  admin.initializeApp();
}

// Mock Stripe client
jest.mock('../client', () => ({
  getStripe: jest.fn(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  })),
}));

// Global test utilities
global.createMockTimestamp = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return admin.firestore.Timestamp.fromDate(dateObj);
};

global.createMockCheckoutSession = (overrides = {}) => ({
  id: 'cs_test_123',
  payment_method_types: ['card'],
  customer_email: 'test@example.com',
  line_items: {
    data: [
      {
        quantity: 1,
        description: 'Test Product',
        amount_total: 1000,
        currency: 'usd',
      },
    ],
  },
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
  payment_status: 'unpaid',
  status: 'open',
  ...overrides,
});

global.createMockPaymentIntent = (overrides = {}) => ({
  id: 'pi_test_123',
  amount: 1000,
  currency: 'usd',
  status: 'requires_payment_method',
  metadata: {},
  ...overrides,
});

// Clean up function to be called after all tests
export const cleanup = () => {
  test.cleanup();
};

// Export wrapped functions for testing
export const wrap = test.wrap;