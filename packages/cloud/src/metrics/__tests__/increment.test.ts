import { firestore } from 'firebase-admin';
import { incrementMetric } from '../increment';
import { firebridgeMetric } from '../utils/metric';

// Mock the firebridgeMetric utility
jest.mock('../utils/metric');

describe('incrementMetric', () => {
  const mockMetric = {
    get: jest.fn(),
    entity: jest.fn(),
  };

  const mockEntity = {
    timeline: jest.fn(),
  };

  const mockTimeline = {
    cursor: {
      increment: jest.fn(),
    },
  };

  beforeEach(() => {
    (firebridgeMetric as jest.Mock).mockReturnValue(mockMetric);
    mockMetric.entity.mockReturnValue(mockEntity);
    mockEntity.timeline.mockReturnValue(mockTimeline);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should increment metric with default values', async () => {
      // Setup
      const mockConfig = {
        units: ['day', 'month'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      // Execute - pass empty object for options
      await incrementMetric('product', 'purchase', 'product-123', {});

      // Verify
      expect(firebridgeMetric).toHaveBeenCalledWith('product', 'purchase');
      expect(mockMetric.entity).toHaveBeenCalledWith('product-123');
      expect(mockEntity.timeline).toHaveBeenCalledWith('day', 'UTC');
      expect(mockEntity.timeline).toHaveBeenCalledWith('month', 'UTC');
      expect(mockTimeline.cursor.increment).toHaveBeenCalledTimes(2);
    });

    it('should increment metric with custom values', async () => {
      // Setup
      const mockConfig = {
        units: ['hour'],
        timezone: 'America/New_York',
      };
      mockMetric.get.mockResolvedValue(mockConfig);
      
      const customTime = createMockTimestamp('2024-01-15T15:30:00Z');

      // Execute
      await incrementMetric('user', 'login', 'user-456', {
        count: 5,
        value: 100.50,
        time: customTime,
      });

      // Verify
      expect(firebridgeMetric).toHaveBeenCalledWith('user', 'login');
      expect(mockMetric.entity).toHaveBeenCalledWith('user-456');
      expect(mockEntity.timeline).toHaveBeenCalledWith('hour', 'America/New_York');
      expect(mockTimeline.cursor.increment).toHaveBeenCalledWith(customTime, {
        count: 5,
        value: 100.50,
      });
    });

    it('should handle missing config gracefully', async () => {
      // Setup
      mockMetric.get.mockResolvedValue(null);

      // Execute
      await incrementMetric('product', 'view', 'product-789', {});

      // Verify - should not throw and should not call timeline methods
      expect(mockEntity.timeline).not.toHaveBeenCalled();
      expect(mockTimeline.cursor.increment).not.toHaveBeenCalled();
    });

    it('should handle empty units array', async () => {
      // Setup
      const mockConfig = {
        units: [],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      // Execute
      await incrementMetric('api', 'request', 'endpoint-1', {});

      // Verify - should not call timeline methods
      expect(mockEntity.timeline).not.toHaveBeenCalled();
      expect(mockTimeline.cursor.increment).not.toHaveBeenCalled();
    });
  });

  describe('timezone handling', () => {
    it('should use UTC as default timezone when not specified', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        // timezone not specified
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      // Execute
      await incrementMetric('store', 'sale', 'store-1', {});

      // Verify
      expect(mockEntity.timeline).toHaveBeenCalledWith('day', 'UTC');
    });

    it('should use configured timezone', async () => {
      // Setup
      const mockConfig = {
        units: ['day', 'week'],
        timezone: 'Europe/London',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      // Execute
      await incrementMetric('order', 'completed', 'order-123', {});

      // Verify
      expect(mockEntity.timeline).toHaveBeenCalledWith('day', 'Europe/London');
      expect(mockEntity.timeline).toHaveBeenCalledWith('week', 'Europe/London');
    });
  });

  describe('multiple time units', () => {
    it('should increment all configured time units', async () => {
      // Setup
      const mockConfig = {
        units: ['hour', 'day', 'week', 'month'],
        timezone: 'America/Los_Angeles',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      // Execute
      await incrementMetric('page', 'view', 'homepage', {
        count: 1,
        value: 0,
      });

      // Verify
      expect(mockEntity.timeline).toHaveBeenCalledTimes(4);
      expect(mockEntity.timeline).toHaveBeenCalledWith('hour', 'America/Los_Angeles');
      expect(mockEntity.timeline).toHaveBeenCalledWith('day', 'America/Los_Angeles');
      expect(mockEntity.timeline).toHaveBeenCalledWith('week', 'America/Los_Angeles');
      expect(mockEntity.timeline).toHaveBeenCalledWith('month', 'America/Los_Angeles');
      expect(mockTimeline.cursor.increment).toHaveBeenCalledTimes(4);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from metric config retrieval', async () => {
      // Setup
      const configError = new Error('Failed to get config');
      mockMetric.get.mockRejectedValue(configError);

      // Execute & Verify
      await expect(
        incrementMetric('product', 'purchase', 'product-123', {})
      ).rejects.toThrow('Failed to get config');
    });

    it('should propagate errors from timeline increment', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);
      
      const incrementError = new Error('Timeline increment failed');
      mockTimeline.cursor.increment.mockRejectedValue(incrementError);

      // Execute & Verify
      await expect(
        incrementMetric('product', 'purchase', 'product-123', {})
      ).rejects.toThrow('Timeline increment failed');
    });
  });

  describe('parameter validation', () => {
    it('should work with zero values', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      // Execute - let incrementMetric use default timestamp
      await incrementMetric('event', 'occurrence', 'event-1', {
        count: 0,
        value: 0,
      });

      // Verify
      expect(mockTimeline.cursor.increment).toHaveBeenCalledWith(
        expect.objectContaining({
          toDate: expect.any(Function),
          toMillis: expect.any(Function),
        }),
        { count: 0, value: 0 }
      );
    });

    it('should work with negative values', async () => {
      // Setup
      const mockConfig = {
        units: ['day'],
        timezone: 'UTC',
      };
      mockMetric.get.mockResolvedValue(mockConfig);

      // Execute - let incrementMetric use default timestamp
      await incrementMetric('account', 'adjustment', 'account-1', {
        count: -1,
        value: -50.00,
      });

      // Verify
      expect(mockTimeline.cursor.increment).toHaveBeenCalledWith(
        expect.objectContaining({
          toDate: expect.any(Function),
          toMillis: expect.any(Function),
        }),
        { count: -1, value: -50.00 }
      );
    });
  });
});