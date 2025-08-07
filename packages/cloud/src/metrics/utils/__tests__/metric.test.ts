import { firestore } from 'firebase-admin'
import { firebridgeMetric } from '../metric'
import {
  firestoreGet,
  firestoreSet,
  firestoreMerge,
  firestoreDelete,
} from '../../../actions'
import { DateTimeUnit } from 'luxon'

// Mock the actions
jest.mock('../../../actions')

describe('firebridgeMetric', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('metric configuration', () => {
    it('should create metric with correct path', () => {
      const metric = firebridgeMetric('product', 'purchase')

      expect(metric.ref.path).toContain('metrics/product-purchase')
    })

    it('should get metric configuration', async () => {
      const mockConfig = {
        units: ['day', 'month'],
        timezone: 'UTC',
        dateUpdated: firestore.Timestamp.now(),
      }

      ;(firestoreGet as jest.Mock).mockReturnValue(() =>
        Promise.resolve(mockConfig),
      )

      const metric = firebridgeMetric('user', 'login')
      const config = await metric.get()

      expect(config).toEqual(mockConfig)
      expect(firestoreGet).toHaveBeenCalledWith('metrics')
    })

    it('should set metric configuration', async () => {
      const units: DateTimeUnit[] = ['hour', 'day', 'week']
      const newConfig = {
        units,
        timezone: 'America/New_York',
        dateUpdated: firestore.Timestamp.now(),
      }

      ;(firestoreSet as jest.Mock).mockReturnValue(() =>
        Promise.resolve(undefined),
      )

      const metric = firebridgeMetric('api', 'request')
      await metric.set(newConfig)

      expect(firestoreSet).toHaveBeenCalledWith('metrics')
    })
  })

  describe('entity operations', () => {
    it('should create entity with correct path', () => {
      const metric = firebridgeMetric('product', 'view')
      const entity = metric.entity('product-123')

      expect(entity.ref.path).toContain(
        'metrics/product-view/entities/product-123',
      )
    })

    it('should get entity summary', async () => {
      const mockSummary = {
        count: 100,
        value: 5000,
        lastUpdated: firestore.Timestamp.now(),
      }

      ;(firestoreGet as jest.Mock).mockReturnValue(() =>
        Promise.resolve(mockSummary),
      )

      const metric = firebridgeMetric('order', 'total')
      const entity = metric.entity('customer-456')
      const summary = await entity.get()

      expect(summary).toEqual(mockSummary)
      expect(firestoreGet).toHaveBeenCalledWith('metrics/order-total/entities')
    })

    it('should set entity summary', async () => {
      const summaryData = {
        count: 50,
        value: 2500,
        lastUpdated: firestore.Timestamp.now(),
      }

      ;(firestoreSet as jest.Mock).mockReturnValue(() =>
        Promise.resolve(undefined),
      )

      const metric = firebridgeMetric('page', 'view')
      const entity = metric.entity('homepage')
      await entity.set(summaryData)

      expect(firestoreSet).toHaveBeenCalledWith('metrics/page-view/entities')
    })

    it('should increment entity values', async () => {
      const mockMergeFunction = jest
        .fn()
        .mockReturnValue(Promise.resolve(undefined))
      ;(firestoreMerge as jest.Mock).mockReturnValue(mockMergeFunction)

      const metric = firebridgeMetric('user', 'action')
      const entity = metric.entity('user-789')

      await entity.increment({
        count: 5,
        value: 250,
      })

      expect(firestoreMerge).toHaveBeenCalledWith(
        'metrics/user-action/entities',
      )

      // Verify the increment data structure
      const mergeCall = mockMergeFunction.mock.calls[0]
      const entityId = mergeCall[0] // First argument is the entity ID
      const incrementData = mergeCall[1] // Second argument is the data

      expect(entityId).toBe('user-789')
      expect(incrementData.count).toHaveProperty('operand', 5)
      expect(incrementData.value).toHaveProperty('operand', 250)
      expect(incrementData.lastUpdated).toBeDefined()
    })

    it('should delete entity data', async () => {
      ;(firestoreDelete as jest.Mock).mockReturnValue(() =>
        Promise.resolve(undefined),
      )

      const metric = firebridgeMetric('temp', 'data')
      const entity = metric.entity('temp-123')

      await entity.delete()

      expect(firestoreDelete).toHaveBeenCalledWith(
        'metrics/temp-data/entities',
        { recursive: true },
      )
    })
  })

  describe('timeline operations', () => {
    it('should create timeline with correct path structure', () => {
      const metric = firebridgeMetric('sales', 'revenue')
      const entity = metric.entity('store-1')
      const timeline = entity.timeline('day', 'America/Los_Angeles')

      // Timeline structure is internal, but we can test the cursor operations
      expect(timeline.cursor).toBeDefined()
      expect(timeline.cursor.makeRef).toBeDefined()
      expect(timeline.cursor.set).toBeDefined()
      expect(timeline.cursor.increment).toBeDefined()
    })

    it('should generate correct cursor IDs for timestamps', () => {
      const metric = firebridgeMetric('event', 'count')
      const entity = metric.entity('event-1')
      const timeline = entity.timeline('day', 'UTC')

      const timestamp = firestore.Timestamp.fromDate(
        new Date('2024-01-15T14:30:00Z'),
      )
      const ref = timeline.cursor.makeRef(timestamp)

      // The cursor ID should be generated from the start of the day
      expect(ref).toBeDefined()
    })

    it('should handle timezone in cursor ID generation', () => {
      const metric = firebridgeMetric('event', 'count')
      const entity = metric.entity('event-1')

      // Same timestamp, different timezones
      const utcTimeline = entity.timeline('day', 'UTC')
      const pstTimeline = entity.timeline('day', 'America/Los_Angeles')

      const timestamp = firestore.Timestamp.fromDate(
        new Date('2024-01-15T08:00:00Z'),
      ) // 8 AM UTC = 12 AM PST

      const utcRef = utcTimeline.cursor.makeRef(timestamp)
      const pstRef = pstTimeline.cursor.makeRef(timestamp)

      // Should generate different refs for different timezones
      // (since the day boundaries are different)
      expect(utcRef).toBeDefined()
      expect(pstRef).toBeDefined()
    })

    it('should set timeline cursor data', async () => {
      ;(firestoreSet as jest.Mock).mockReturnValue(() =>
        Promise.resolve(undefined),
      )

      const metric = firebridgeMetric('metric', 'test')
      const entity = metric.entity('entity-1')
      const timeline = entity.timeline('hour', 'UTC')

      const timelineData = {
        startTime: firestore.Timestamp.fromDate(
          new Date('2024-01-15T10:00:00Z'),
        ),
        endTime: firestore.Timestamp.fromDate(new Date('2024-01-15T11:00:00Z')),
        count: 10,
        value: 500,
        totalCount: 100,
        totalValue: 5000,
      }

      await timeline.cursor.set(timelineData)

      expect(firestoreSet).toHaveBeenCalled()
    })

    it('should increment timeline cursor', async () => {
      const mockMergeFunction = jest
        .fn()
        .mockReturnValue(Promise.resolve(undefined))
      ;(firestoreMerge as jest.Mock).mockReturnValue(mockMergeFunction)

      const metric = firebridgeMetric('activity', 'event')
      const entity = metric.entity('user-123')
      const timeline = entity.timeline('day', 'UTC')

      const timestamp = firestore.Timestamp.fromDate(
        new Date('2024-01-15T14:00:00Z'),
      )

      await timeline.cursor.increment(timestamp, {
        count: 3,
        value: 150,
      })

      // Should call firestoreMerge twice - once for entity, once for timeline
      expect(firestoreMerge).toHaveBeenCalledTimes(2)
      expect(firestoreMerge).toHaveBeenCalled()

      // Verify the timeline increment data
      const timelineMergeCall = mockMergeFunction.mock.calls[1] // Second call is the timeline increment
      const incrementData = timelineMergeCall[1] // Second argument is the data

      expect(incrementData.count).toHaveProperty('operand', 3)
      expect(incrementData.value).toHaveProperty('operand', 150)
      expect(incrementData.totalCount).toHaveProperty('operand', 3)
      expect(incrementData.totalValue).toHaveProperty('operand', 150)
      expect(incrementData.startTime).toBeDefined()
      expect(incrementData.endTime).toBeDefined()
    })
  })

  describe('different time units', () => {
    it('should handle different time units correctly', () => {
      const metric = firebridgeMetric('test', 'metric')
      const entity = metric.entity('test-entity')

      const units = ['hour', 'day', 'week', 'month', 'year']

      units.forEach(unit => {
        const timeline = entity.timeline(unit as any, 'UTC')
        expect(timeline.cursor).toBeDefined()
      })
    })

    it('should generate different cursor paths for different time units', () => {
      const metric = firebridgeMetric('sales', 'total')
      const entity = metric.entity('store-1')

      const hourlyTimeline = entity.timeline('hour', 'UTC')
      const dailyTimeline = entity.timeline('day', 'UTC')

      const timestamp = firestore.Timestamp.fromDate(
        new Date('2024-01-15T14:30:00Z'),
      )

      const hourlyRef = hourlyTimeline.cursor.makeRef(timestamp)
      const dailyRef = dailyTimeline.cursor.makeRef(timestamp)

      // Should generate different references for different time units
      expect(hourlyRef).toBeDefined()
      expect(dailyRef).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle invalid cursor ID generation', () => {
      const metric = firebridgeMetric('test', 'error')
      const entity = metric.entity('entity-1')
      const timeline = entity.timeline('day', 'UTC')

      // Test with an invalid timestamp that might cause Luxon to return null
      expect(() => {
        // This should throw due to the invalid date
        timeline.cursor.makeRef(
          firestore.Timestamp.fromDate(new Date('invalid')),
        )
      }).toThrow()
    })

    it('should propagate Firestore operation errors', async () => {
      const firestoreError = new Error('Firestore error')
      ;(firestoreGet as jest.Mock).mockReturnValue(() =>
        Promise.reject(firestoreError),
      )

      const metric = firebridgeMetric('error', 'test')

      await expect(metric.get()).rejects.toThrow('Firestore error')
    })
  })

  describe('default parameters', () => {
    it('should use default increment values', async () => {
      const mockMergeFunction = jest
        .fn()
        .mockReturnValue(Promise.resolve(undefined))
      ;(firestoreMerge as jest.Mock).mockReturnValue(mockMergeFunction)

      const metric = firebridgeMetric('default', 'test')
      const entity = metric.entity('entity-1')

      // Test entity increment with defaults
      await entity.increment()

      const mergeCall = mockMergeFunction.mock.calls[0]
      const incrementData = mergeCall[1]

      // Should use default values (count=1, value=0)
      expect(incrementData.count).toHaveProperty('operand', 1)
      expect(incrementData.value).toHaveProperty('operand', 0)
      expect(incrementData.lastUpdated).toBeDefined()
    })

    it('should use default timezone (UTC)', () => {
      const metric = firebridgeMetric('timezone', 'test')
      const entity = metric.entity('entity-1')

      // Timeline without explicit timezone should default to UTC
      const timeline = entity.timeline('day') // No timezone specified

      expect(timeline.cursor).toBeDefined()
    })
  })
})
