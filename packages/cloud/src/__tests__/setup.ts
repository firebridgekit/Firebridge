import { Timestamp } from 'firebase-admin/firestore'

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
  const mockTimestamp = {
    now: jest.fn(() => ({
      toDate: () => new Date('2024-01-15T10:00:00Z'),
      toMillis: () => 1705312800000,
      seconds: Math.floor(1705312800000 / 1000),
      nanoseconds: 0,
    })),
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
    })),
    fromMillis: jest.fn((millis: number) => ({
      toDate: () => new Date(millis),
      toMillis: () => millis,
    })),
  }

  const mockFieldValue = {
    increment: jest.fn((value: number) => ({
      _methodName: 'FieldValue.increment',
      _elements: [value],
    })),
    delete: jest.fn(() => ({ _methodName: 'FieldValue.delete' })),
    serverTimestamp: jest.fn(() => ({
      _methodName: 'FieldValue.serverTimestamp',
    })),
  }

  const mockDocumentReference = {
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ data: () => null, exists: false }),
    delete: jest.fn().mockResolvedValue(undefined),
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
  }

  const mockCollectionReference = {
    doc: jest.fn(() => mockDocumentReference),
    add: jest.fn().mockResolvedValue(mockDocumentReference),
    get: jest.fn().mockResolvedValue({ docs: [] }),
  }

  const mockFirestoreInstance = {
    collection: jest.fn(() => mockCollectionReference),
    doc: jest.fn(() => mockDocumentReference),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
    runTransaction: jest.fn(),
    Timestamp: mockTimestamp,
    FieldValue: mockFieldValue,
  }

  const firestore = jest.fn(() => mockFirestoreInstance)
  firestore.Timestamp = mockTimestamp
  firestore.FieldValue = mockFieldValue

  return {
    firestore,
    Timestamp: mockTimestamp,
    FieldValue: mockFieldValue,
  }
})

// Mock the firestore export
jest.mock('firebase-admin/firestore', () => {
  // Define mockFirestore inside the factory function to avoid temporal dead zone
  const mockFirestore = () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({ data: () => null, exists: false }),
        delete: jest.fn().mockResolvedValue(undefined),
      })),
    })),
    doc: jest.fn(() => ({
      set: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue({ data: () => null, exists: false }),
      delete: jest.fn().mockResolvedValue(undefined),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
    Timestamp: {
      now: jest.fn(() => ({
        toDate: () => new Date('2024-01-15T10:00:00Z'),
        toMillis: () => 1705312800000,
      })),
      fromDate: jest.fn((date: Date) => ({
        toDate: () => date,
        toMillis: () => date.getTime(),
      })),
      fromMillis: jest.fn((millis: number) => ({
        toDate: () => new Date(millis),
        toMillis: () => millis,
      })),
    },
    FieldValue: {
      increment: jest.fn((value: number) => ({
        _methodName: 'FieldValue.increment',
        _elements: [value],
      })),
      delete: jest.fn(() => ({ _methodName: 'FieldValue.delete' })),
      serverTimestamp: jest.fn(() => ({
        _methodName: 'FieldValue.serverTimestamp',
      })),
    },
  })

  return {
    firestore: mockFirestore,
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date('2024-01-15T10:00:00Z'),
      toMillis: () => 1705312800000,
      seconds: Math.floor(1705312800000 / 1000),
      nanoseconds: 0,
    })),
    fromDate: jest.fn((date: Date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
    })),
    fromMillis: jest.fn((millis: number) => ({
      toDate: () => new Date(millis),
      toMillis: () => millis,
    })),
  },
  FieldValue: {
    increment: jest.fn((value: number) => ({
      _methodName: 'FieldValue.increment',
      _elements: [value],
    })),
    delete: jest.fn(() => ({ _methodName: 'FieldValue.delete' })),
    serverTimestamp: jest.fn(() => ({
      _methodName: 'FieldValue.serverTimestamp',
    })),
  },
  }
})

// Mock Firebase Functions
jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  https: {
    onCall: jest.fn(),
    onRequest: jest.fn(),
  },
}))

// Global test utilities
global.createMockTimestamp = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return {
    // Converts this object to a primitive string, which allows Timestamp
    // objects to be compared using the >, <=, >= and > operators.
    valueOf: () => dateObj.getTime().toString(),
    seconds: Math.floor(dateObj.getTime() / 1000),
    nanoseconds: (dateObj.getTime() % 1000) * 1000000,
    isEqual: (other: any) => {
      return dateObj.getTime() === other.toMillis()
    },
    toDate: () => dateObj,
    toMillis: () => dateObj.getTime(),
  }
}

global.createMockEvent = (time: string | Date, count = 1, value = 0) => ({
  time: createMockTimestamp(time),
  count,
  value,
})

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
