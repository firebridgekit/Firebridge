import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { 
  setCheckout, 
  getCheckout, 
  updateCheckout,
  getCheckoutBySession,
  getCheckouts
} from '../index';
import { readSnapshot } from '@firebridge/cloud';

// Mock firebase-admin/firestore
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({
      toDate: () => date,
      toMillis: () => date.getTime(),
    })),
  },
}));

// Mock @firebridge/cloud
jest.mock('@firebridge/cloud', () => ({
  firestoreGet: jest.fn((collection) => jest.fn()),
  firestoreAdd: jest.fn((collection) => jest.fn()),
  firestoreUpdate: jest.fn((collection) => jest.fn()),
  firestoreSet: jest.fn((collection) => jest.fn()),
  firestoreDelete: jest.fn((collection) => jest.fn()),
  readSnapshot: jest.fn(),
}));

describe('checkoutOperations', () => {
  const mockFirestore = {
    collection: jest.fn(),
  };

  const mockCollection = {
    doc: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    get: jest.fn(),
  };

  const mockDoc = {
    set: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
  };

  const mockQuery = {
    where: jest.fn(),
    limit: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    mockFirestore.collection.mockReturnValue(mockCollection);
    mockCollection.doc.mockReturnValue(mockDoc);
    mockCollection.where.mockReturnValue(mockQuery);
    mockQuery.where.mockReturnValue(mockQuery);
    mockQuery.limit.mockReturnValue(mockQuery);
  });

  describe('getCheckoutBySession', () => {
    it('should retrieve checkout by session ID', async () => {
      // Setup
      const sessionId = 'cs_test_session_456';
      const checkoutData = {
        session: sessionId,
        uid: 'user-789',
        status: 'completed',
        items: [{ id: 'item-5', quantity: 2, name: 'Product 5' }],
        itemIds: ['item-5'],
        dateCreated: new Date('2024-01-15T15:00:00Z'),
        dateUpdated: new Date('2024-01-15T16:00:00Z'),
      };

      const mockSnapshot = {
        id: 'CHECKOUT-ID-123',
        data: () => checkoutData,
        exists: true,
      };

      mockQuery.get.mockResolvedValue({
        size: 1,
        docs: [mockSnapshot],
      });

      (readSnapshot as jest.Mock).mockReturnValue({
        ...checkoutData,
        id: 'CHECKOUT-ID-123',
      });

      // Execute
      const result = await getCheckoutBySession(sessionId);

      // Verify
      expect(mockFirestore.collection).toHaveBeenCalledWith('checkouts');
      expect(mockCollection.where).toHaveBeenCalledWith('session', '==', sessionId);
      expect(mockQuery.limit).toHaveBeenCalledWith(1);
      expect(readSnapshot).toHaveBeenCalledWith(mockSnapshot);
      expect(result).toEqual({
        ...checkoutData,
        id: 'CHECKOUT-ID-123',
      });
    });

    it('should throw error when checkout not found', async () => {
      // Setup
      mockQuery.get.mockResolvedValue({
        size: 0,
        docs: [],
      });

      // Execute & Verify
      await expect(getCheckoutBySession('non-existent-session')).rejects.toThrow(
        'checkout not found'
      );
    });

    it('should throw error when readSnapshot returns null', async () => {
      // Setup
      const mockSnapshot = {
        id: 'CHECKOUT-ID',
        data: () => ({}),
        exists: true,
      };

      mockQuery.get.mockResolvedValue({
        size: 1,
        docs: [mockSnapshot],
      });

      (readSnapshot as jest.Mock).mockReturnValue(null);

      // Execute & Verify
      await expect(getCheckoutBySession('session-123')).rejects.toThrow(
        'checkout not found'
      );
    });
  });

  describe('getCheckouts', () => {
    it('should retrieve completed checkouts', async () => {
      // Setup
      const checkoutData1 = {
        session: 'cs_1',
        uid: 'user-1',
        status: 'completed',
        items: [],
        itemIds: [],
        dateCreated: Timestamp.fromDate(new Date('2024-01-15T10:00:00Z')),
        dateUpdated: Timestamp.fromDate(new Date('2024-01-15T11:00:00Z')),
      };

      const checkoutData2 = {
        session: 'cs_2',
        uid: 'user-2',
        status: 'completed',
        items: [],
        itemIds: [],
        dateCreated: Timestamp.fromDate(new Date('2024-01-16T10:00:00Z')),
        dateUpdated: Timestamp.fromDate(new Date('2024-01-16T11:00:00Z')),
      };

      mockQuery.get.mockResolvedValue({
        docs: [
          { id: 'checkout-1', data: () => checkoutData1 },
          { id: 'checkout-2', data: () => checkoutData2 },
        ],
      });

      // Execute
      const result = await getCheckouts({});

      // Verify
      expect(mockFirestore.collection).toHaveBeenCalledWith('checkouts');
      expect(mockCollection.where).toHaveBeenCalledWith('status', '==', 'completed');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...checkoutData1,
        id: 'checkout-1',
        dateCreated: checkoutData1.dateCreated.toDate(),
        dateUpdated: checkoutData1.dateUpdated.toDate(),
      });
      expect(result[1]).toEqual({
        ...checkoutData2,
        id: 'checkout-2',
        dateCreated: checkoutData2.dateCreated.toDate(),
        dateUpdated: checkoutData2.dateUpdated.toDate(),
      });
    });

    it('should filter checkouts by sinceDate', async () => {
      // Setup
      const sinceDate = Timestamp.fromDate(new Date('2024-01-15T00:00:00Z'));
      const checkoutData = {
        session: 'cs_recent',
        uid: 'user-recent',
        status: 'completed',
        items: [],
        itemIds: [],
        dateCreated: Timestamp.fromDate(new Date('2024-01-16T10:00:00Z')),
        dateUpdated: Timestamp.fromDate(new Date('2024-01-16T11:00:00Z')),
      };

      mockQuery.get.mockResolvedValue({
        docs: [{ id: 'recent-checkout', data: () => checkoutData }],
      });

      // Execute
      const result = await getCheckouts({ sinceDate });

      // Verify
      expect(mockCollection.where).toHaveBeenCalledWith('status', '==', 'completed');
      expect(mockQuery.where).toHaveBeenCalledWith('dateCreated', '>=', sinceDate);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('recent-checkout');
    });

    it('should return empty array when no checkouts found', async () => {
      // Setup
      mockQuery.get.mockResolvedValue({
        docs: [],
      });

      // Execute
      const result = await getCheckouts({});

      // Verify
      expect(result).toEqual([]);
    });

    it('should handle checkouts without sinceDate filter', async () => {
      // Setup
      const checkoutData = {
        session: 'cs_all',
        uid: 'user-all',
        status: 'completed',
        items: [],
        itemIds: [],
        dateCreated: Timestamp.fromDate(new Date('2024-01-10T10:00:00Z')),
        dateUpdated: Timestamp.fromDate(new Date('2024-01-10T11:00:00Z')),
      };

      mockQuery.get.mockResolvedValue({
        docs: [{ id: 'all-checkout', data: () => checkoutData }],
      });

      // Execute
      const result = await getCheckouts({});

      // Verify
      expect(mockCollection.where).toHaveBeenCalledWith('status', '==', 'completed');
      expect(mockQuery.where).not.toHaveBeenCalledWith('dateCreated', '>=', expect.anything());
      expect(result).toHaveLength(1);
    });
  });
});