import { firestore } from 'firebase-admin';
import { updateMetric } from '../update';
import { firebridgeMetric, buildTimeline } from '../utils';
import { executeFirestoreBatch } from '../../execution';

// Mock dependencies
jest.mock('../utils/metric');
jest.mock('../utils/buildTimeline');
jest.mock('../../execution');

describe('updateMetric', () => {
  const mockMetric = {
    get: jest.fn(),
    entity: jest.fn(),
  };

  const mockEntity = {
    delete: jest.fn(),
    set: jest.fn(),
    timeline: jest.fn(),
  };

  const mockTimeline = {
    cursor: {
      makeRef: jest.fn(),
    },
  };

  beforeEach(() => {
    (firebridgeMetric as jest.Mock).mockReturnValue(mockMetric);
    mockMetric.entity.mockReturnValue(mockEntity);
    mockEntity.timeline.mockReturnValue(mockTimeline);
    mockTimeline.cursor.makeRef.mockReturnValue({ path: 'mocked/path' });
    (executeFirestoreBatch as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should update metrics with events', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      const events = [
        createMockEvent('2024-01-15T10:00:00Z', 1, 100),
        createMockEvent('2024-01-15T11:00:00Z', 2, 200),
      ];

      const mockTimelineData = [
        {
          startTime: createMockTimestamp('2024-01-15T00:00:00Z'),
          endTime: createMockTimestamp('2024-01-16T00:00:00Z'),
          count: 3,
          value: 300,
          totalCount: 3,
          totalValue: 300,
        },
      ];

      (buildTimeline as jest.Mock).mockReturnValue(mockTimelineData);

      // Execute
      await updateMetric('product', 'purchase', 'product-123', events);

      // Verify
      expect(firebridgeMetric).toHaveBeenCalledWith('product', 'purchase');
      expect(mockMetric.entity).toHaveBeenCalledWith('product-123');
      expect(mockEntity.delete).toHaveBeenCalled(); // clean = true by default
      expect(buildTimeline).toHaveBeenCalledWith(events, {
        unit: 'day',
        timezone: 'UTC',
        startingCount: 0,
        startingValue: 0,
      });
    });

    it('should handle empty events array', async () => {
      // Execute
      await updateMetric('product', 'purchase', 'product-123', []);

      // Verify - should return early without doing anything
      expect(firebridgeMetric).not.toHaveBeenCalled();
      expect(executeFirestoreBatch).not.toHaveBeenCalled();
    });

    it('should use custom options', async () => {
      // Setup
      const mockConfig = {
        units: ['hour', 'day'],
        timezone: 'America/New_York',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 50)];
      
      (buildTimeline as jest.Mock).mockReturnValue([]);

      // Execute
      await updateMetric('user', 'action', 'user-456', events, {
        startingCount: 100,
        startingValue: 1000,
        clean: false,
      });

      // Verify
      expect(mockEntity.delete).not.toHaveBeenCalled(); // clean = false
      expect(buildTimeline).toHaveBeenCalledWith(events, {
        unit: 'hour',
        timezone: 'America/New_York',
        startingCount: 100,
        startingValue: 1000,
      });
      expect(buildTimeline).toHaveBeenCalledWith(events, {
        unit: 'day',
        timezone: 'America/New_York',
        startingCount: 100,
        startingValue: 1000,
      });
    });
  });

  describe('timezone handling', () => {
    it('should use UTC as default timezone', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        // timezone not specified
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];
      (buildTimeline as jest.Mock).mockReturnValue([]);

      // Execute
      await updateMetric('api', 'request', 'endpoint-1', events);

      // Verify
      expect(buildTimeline).toHaveBeenCalledWith(events, {
        unit: 'day',
        timezone: 'UTC',
        startingCount: 0,
        startingValue: 0,
      });
    });

    it('should use configured timezone', async () => {
      // Setup
      const mockConfig = {
        units: ['week'],
        timezone: 'Europe/London',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];
      (buildTimeline as jest.Mock).mockReturnValue([]);

      // Execute
      await updateMetric('store', 'sale', 'store-london', events);

      // Verify
      expect(buildTimeline).toHaveBeenCalledWith(events, {
        unit: 'week',
        timezone: 'Europe/London',
        startingCount: 0,
        startingValue: 0,
      });
    });
  });

  describe('batch operations', () => {
    it('should create batch operations for timeline updates', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];
      
      const mockTimelineData = [
        {
          startTime: createMockTimestamp('2024-01-15T00:00:00Z'),
          endTime: createMockTimestamp('2024-01-16T00:00:00Z'),
          count: 1,
          value: 100,
          totalCount: 1,
          totalValue: 100,
        },
      ];

      (buildTimeline as jest.Mock).mockReturnValue(mockTimelineData);
      mockTimeline.cursor.makeRef.mockReturnValue({ path: 'timeline/ref' });

      // Execute
      await updateMetric('product', 'view', 'product-123', events);

      // Verify batch operations
      expect(executeFirestoreBatch).toHaveBeenCalledWith([
        {
          type: 'set',
          ref: { path: 'timeline/ref' },
          data: mockTimelineData[0],
        },
      ]);

      // Verify entity summary update
      expect(mockEntity.set).toHaveBeenCalledWith({
        lastUpdated: expect.any(Object),
        count: 1,
        value: 100,
      });
    });

    it('should handle multiple time units with separate batch operations', async () => {
      // Setup
      const mockConfig = {
        units: ['day', 'month'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      const events = [createMockEvent('2024-01-15T10:00:00Z', 5, 500)];
      
      const mockDayTimeline = [
        {
          startTime: createMockTimestamp('2024-01-15T00:00:00Z'),
          count: 5,
          value: 500,
          totalCount: 5,
          totalValue: 500,
        },
      ];

      const mockMonthTimeline = [
        {
          startTime: createMockTimestamp('2024-01-01T00:00:00Z'),
          count: 5,
          value: 500,
          totalCount: 5,
          totalValue: 500,
        },
      ];

      (buildTimeline as jest.Mock)
        .mockReturnValueOnce(mockDayTimeline)
        .mockReturnValueOnce(mockMonthTimeline);

      // Execute
      await updateMetric('order', 'total', 'customer-1', events);

      // Verify both timelines were processed
      expect(buildTimeline).toHaveBeenCalledTimes(2);
      expect(executeFirestoreBatch).toHaveBeenCalledWith([
        {
          type: 'set',
          ref: expect.any(Object),
          data: mockDayTimeline[0],
        },
        {
          type: 'set',
          ref: expect.any(Object),
          data: mockMonthTimeline[0],
        },
      ]);
    });
  });

  describe('error handling', () => {
    it('should propagate config retrieval errors', async () => {
      // Setup
      const configError = new Error('Config not found');
      mockMetric.get.mockRejectedValue(configError);

      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];

      // Execute & Verify
      await expect(
        updateMetric('product', 'purchase', 'product-123', events)
      ).rejects.toThrow('Config not found');
    });

    it('should propagate batch execution errors', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];
      (buildTimeline as jest.Mock).mockReturnValue([
        {
          startTime: createMockTimestamp('2024-01-15T00:00:00Z'),
          count: 1,
          value: 100,
          totalCount: 1,
          totalValue: 100,
        },
      ]);

      const batchError = new Error('Batch execution failed');
      (executeFirestoreBatch as jest.Mock).mockRejectedValue(batchError);

      // Execute & Verify
      await expect(
        updateMetric('product', 'purchase', 'product-123', events)
      ).rejects.toThrow('Batch execution failed');
    });

    it('should propagate entity summary update errors', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];
      (buildTimeline as jest.Mock).mockReturnValue([
        {
          startTime: createMockTimestamp('2024-01-15T00:00:00Z'),
          count: 1,
          value: 100,
          totalCount: 1,
          totalValue: 100,
        },
      ]);

      const summaryError = new Error('Summary update failed');
      mockEntity.set.mockRejectedValue(summaryError);

      // Execute & Verify
      await expect(
        updateMetric('product', 'purchase', 'product-123', events)
      ).rejects.toThrow('Summary update failed');
    });
  });

  describe('edge cases', () => {
    it('should handle missing config gracefully', async () => {
      // Setup
      mockMetric.get.mockResolvedValue(null);
      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];

      // Execute
      await updateMetric('product', 'purchase', 'product-123', events);

      // Verify - should not process timelines but should still delete if clean=true
      expect(mockEntity.delete).toHaveBeenCalled();
      expect(buildTimeline).not.toHaveBeenCalled();
      expect(executeFirestoreBatch).toHaveBeenCalledWith([]);
    });

    it('should handle empty timeline data', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)];
      (buildTimeline as jest.Mock).mockReturnValue([]); // Empty timeline

      // Execute
      await updateMetric('product', 'purchase', 'product-123', events);

      // Verify
      expect(executeFirestoreBatch).toHaveBeenCalledWith([]);
      expect(mockEntity.set).toHaveBeenCalledWith({
        lastUpdated: expect.any(Object),
        count: undefined, // No updates to process
        value: undefined,
      });
    });
  });
});