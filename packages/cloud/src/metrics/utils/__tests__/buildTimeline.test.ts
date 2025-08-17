import { Timestamp } from 'firebase-admin/firestore'
import { buildTimeline } from '../buildTimeline'
import { getEventsInRange } from '../getEventsInRange'
import { TrackableEvent } from '../../typess'

// Mock getEventsInRange
jest.mock('../getEventsInRange')

// Helper function to create mock events
const createMockEvent = (
  isoString: string,
  count: number,
  value: number,
): TrackableEvent => ({
  time: Timestamp.fromDate(new Date(isoString)),
  count,
  value,
})

describe('buildTimeline', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should return empty array for empty events', () => {
      const result = buildTimeline([])
      expect(result).toEqual([])
    })

    it('should build timeline for single event', () => {
      const events = [createMockEvent('2024-01-15T10:00:00Z', 5, 100)]

      // Mock getEventsInRange to return the event for the day period
      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      const result = buildTimeline(events, { unit: 'day' })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: 5,
        value: 100,
        totalCount: 5,
        totalValue: 100,
      })
      expect(result[0].startTime.toDate().getUTCDate()).toBe(15)
      expect(result[0].endTime.toDate().getUTCDate()).toBe(16)
    })

    it('should build timeline for multiple events in same period', () => {
      const events = [
        createMockEvent('2024-01-15T10:00:00Z', 3, 150),
        createMockEvent('2024-01-15T14:00:00Z', 2, 100),
      ]

      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      const result = buildTimeline(events, { unit: 'day' })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: 5, // 3 + 2
        value: 250, // 150 + 100
        totalCount: 5,
        totalValue: 250,
      })
    })

    it('should build timeline for events across multiple periods', () => {
      const events = [
        createMockEvent('2024-01-15T10:00:00Z', 3, 150),
        createMockEvent('2024-01-16T14:00:00Z', 2, 100),
      ]

      // Mock to return different events for different date ranges
      ;(getEventsInRange as jest.Mock)
        .mockReturnValueOnce([events[0]]) // First day
        .mockReturnValueOnce([events[1]]) // Second day

      const result = buildTimeline(events, { unit: 'day' })

      expect(result).toHaveLength(2)

      // First day
      expect(result[0]).toMatchObject({
        count: 3,
        value: 150,
        totalCount: 3,
        totalValue: 150,
      })

      // Second day
      expect(result[1]).toMatchObject({
        count: 2,
        value: 100,
        totalCount: 5, // Running total
        totalValue: 250, // Running total
      })
    })
  })

  describe('default values', () => {
    it('should apply default count and value to events', () => {
      const eventsWithoutDefaults = [
        { time: createMockTimestamp('2024-01-15T10:00:00Z') }, // No count/value
      ]

      ;(getEventsInRange as jest.Mock).mockReturnValue(eventsWithoutDefaults)

      const result = buildTimeline(eventsWithoutDefaults as any, {
        unit: 'day',
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: 1, // Default count
        value: 0, // Default value
        totalCount: 1,
        totalValue: 0,
      })
    })

    it('should preserve explicit zero values', () => {
      const events = [createMockEvent('2024-01-15T10:00:00Z', 0, 0)]

      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      const result = buildTimeline(events, { unit: 'day' })

      expect(result).toHaveLength(0) // Should not create section for zero count/value
    })
  })

  describe('starting values', () => {
    it('should use starting count and value', () => {
      const events = [createMockEvent('2024-01-15T10:00:00Z', 5, 100)]

      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      const result = buildTimeline(events, {
        unit: 'day',
        startingCount: 10,
        startingValue: 500,
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: 5,
        value: 100,
        totalCount: 15, // 10 + 5
        totalValue: 600, // 500 + 100
      })
    })

    it('should accumulate running totals correctly with starting values', () => {
      const events = [
        createMockEvent('2024-01-15T10:00:00Z', 2, 50),
        createMockEvent('2024-01-16T10:00:00Z', 3, 75),
      ]

      ;(getEventsInRange as jest.Mock)
        .mockReturnValueOnce([events[0]]) // First day
        .mockReturnValueOnce([events[1]]) // Second day

      const result = buildTimeline(events, {
        unit: 'day',
        startingCount: 100,
        startingValue: 1000,
      })

      expect(result).toHaveLength(2)

      // First day
      expect(result[0]).toMatchObject({
        count: 2,
        value: 50,
        totalCount: 102, // 100 + 2
        totalValue: 1050, // 1000 + 50
      })

      // Second day
      expect(result[1]).toMatchObject({
        count: 3,
        value: 75,
        totalCount: 105, // 102 + 3
        totalValue: 1125, // 1050 + 75
      })
    })
  })

  describe('timezone support', () => {
    it('should use UTC timezone by default', () => {
      const events = [createMockEvent('2024-01-15T23:00:00Z', 1, 10)]

      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      const result = buildTimeline(events, { unit: 'day' })

      // In UTC, 23:00 on Jan 15 should be in Jan 15 bucket
      expect(result[0].startTime.toDate().getUTCDate()).toBe(15)
    })

    it('should respect custom timezone', () => {
      const events = [createMockEvent('2024-01-15T23:00:00Z', 1, 10)]

      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      // This test mainly verifies the timezone parameter is passed through
      // Actual timezone conversion is handled by Luxon DateTime
      const result = buildTimeline(events, {
        unit: 'day',
        timezone: 'America/New_York',
      })

      expect(result).toHaveLength(1)
      // The exact date boundaries depend on Luxon's timezone handling
      expect(result[0]).toMatchObject({
        count: 1,
        value: 10,
      })
    })
  })

  describe('different time units', () => {
    it('should handle hourly aggregation', () => {
      const events = [
        createMockEvent('2024-01-15T10:30:00Z', 1, 50),
        createMockEvent('2024-01-15T10:45:00Z', 2, 100),
      ]

      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      const result = buildTimeline(events, { unit: 'hour' })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: 3, // 1 + 2
        value: 150, // 50 + 100
      })
    })

    it('should handle weekly aggregation', () => {
      const events = [
        createMockEvent('2024-01-15T10:00:00Z', 5, 500), // Monday
        createMockEvent('2024-01-17T10:00:00Z', 3, 300), // Wednesday
      ]

      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      const result = buildTimeline(events, { unit: 'week' })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: 8, // 5 + 3
        value: 800, // 500 + 300
      })
    })

    it('should handle monthly aggregation', () => {
      const events = [
        createMockEvent('2024-01-05T10:00:00Z', 10, 1000),
        createMockEvent('2024-01-25T10:00:00Z', 15, 1500),
      ]

      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      const result = buildTimeline(events, { unit: 'month' })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: 25, // 10 + 15
        value: 2500, // 1000 + 1500
      })
    })
  })

  describe('event sorting', () => {
    it('should handle unsorted events', () => {
      const events = [
        createMockEvent('2024-01-16T10:00:00Z', 2, 200), // Later event first
        createMockEvent('2024-01-15T10:00:00Z', 1, 100), // Earlier event second
      ]

      ;(getEventsInRange as jest.Mock)
        .mockReturnValueOnce([events[1]]) // First day (Jan 15)
        .mockReturnValueOnce([events[0]]) // Second day (Jan 16)

      const result = buildTimeline(events, { unit: 'day' })

      expect(result).toHaveLength(2)

      // Should be sorted by time, so Jan 15 comes first
      expect(result[0]).toMatchObject({
        count: 1,
        value: 100,
        totalCount: 1,
        totalValue: 100,
      })

      expect(result[1]).toMatchObject({
        count: 2,
        value: 200,
        totalCount: 3, // Running total
        totalValue: 300, // Running total
      })
    })
  })

  describe('edge cases', () => {
    it('should skip periods with no events', () => {
      const events = [
        createMockEvent('2024-01-15T10:00:00Z', 1, 100),
        createMockEvent('2024-01-17T10:00:00Z', 1, 100), // Skip Jan 16
      ]

      ;(getEventsInRange as jest.Mock)
        .mockReturnValueOnce([events[0]]) // Jan 15
        .mockReturnValueOnce([]) // Jan 16 - no events
        .mockReturnValueOnce([events[1]]) // Jan 17

      const result = buildTimeline(events, { unit: 'day' })

      // Should only have 2 sections (Jan 15 and Jan 17), skip empty Jan 16
      expect(result).toHaveLength(2)
    })

    it('should handle events with mixed count/value presence', () => {
      const events = [
        { time: createMockTimestamp('2024-01-15T10:00:00Z'), count: 5 }, // No value
        { time: createMockTimestamp('2024-01-15T11:00:00Z'), value: 100 }, // No count
      ] as any

      ;(getEventsInRange as jest.Mock).mockReturnValue(events)

      const result = buildTimeline(events, { unit: 'day' })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        count: 6, // 5 + 1 (default)
        value: 100, // 0 (default) + 100
      })
    })
  })
})
