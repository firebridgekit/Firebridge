import { Timestamp } from 'firebase-admin/firestore'
import { getEventsInRange } from '../getEventsInRange'
import { TrackableEvent } from '../../typess'

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

describe('getEventsInRange', () => {
  it('should filter events within date range', () => {
    const events = [
      createMockEvent('2024-01-14T10:00:00Z', 1, 100), // Before range
      createMockEvent('2024-01-15T10:00:00Z', 2, 200), // In range
      createMockEvent('2024-01-16T10:00:00Z', 3, 300), // In range
      createMockEvent('2024-01-17T10:00:00Z', 4, 400), // After range
    ]

    const fromDate = new Date('2024-01-15T00:00:00Z')
    const toDate = new Date('2024-01-17T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    expect(result).toHaveLength(2)
    expect(result[0].count).toBe(2)
    expect(result[1].count).toBe(3)
  })

  it('should include events at fromDate boundary', () => {
    const events = [
      createMockEvent('2024-01-15T00:00:00Z', 1, 100), // Exactly at fromDate
      createMockEvent('2024-01-15T10:00:00Z', 2, 200), // After fromDate
    ]

    const fromDate = new Date('2024-01-15T00:00:00Z')
    const toDate = new Date('2024-01-16T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    expect(result).toHaveLength(2)
  })

  it('should exclude events at toDate boundary', () => {
    const events = [
      createMockEvent('2024-01-15T23:59:59Z', 1, 100), // Just before toDate
      createMockEvent('2024-01-16T00:00:00Z', 2, 200), // Exactly at toDate (excluded)
    ]

    const fromDate = new Date('2024-01-15T00:00:00Z')
    const toDate = new Date('2024-01-16T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(1)
  })

  it('should return empty array when no events in range', () => {
    const events = [
      createMockEvent('2024-01-10T10:00:00Z', 1, 100),
      createMockEvent('2024-01-20T10:00:00Z', 2, 200),
    ]

    const fromDate = new Date('2024-01-15T00:00:00Z')
    const toDate = new Date('2024-01-16T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    expect(result).toHaveLength(0)
  })

  it('should handle empty events array', () => {
    const events: any[] = []
    const fromDate = new Date('2024-01-15T00:00:00Z')
    const toDate = new Date('2024-01-16T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    expect(result).toHaveLength(0)
  })

  it('should handle single event in range', () => {
    const events = [createMockEvent('2024-01-15T12:00:00Z', 5, 500)]

    const fromDate = new Date('2024-01-15T00:00:00Z')
    const toDate = new Date('2024-01-16T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(5)
    expect(result[0].value).toBe(500)
  })

  it('should handle events with same timestamp', () => {
    const events = [
      createMockEvent('2024-01-15T12:00:00Z', 1, 100),
      createMockEvent('2024-01-15T12:00:00Z', 2, 200),
      createMockEvent('2024-01-15T12:00:00Z', 3, 300),
    ]

    const fromDate = new Date('2024-01-15T00:00:00Z')
    const toDate = new Date('2024-01-16T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    expect(result).toHaveLength(3)
  })

  it('should work with millisecond precision', () => {
    const events = [
      createMockEvent('2024-01-15T12:00:00.000Z', 1, 100), // In range
      createMockEvent('2024-01-15T12:00:00.999Z', 2, 200), // In range
      createMockEvent('2024-01-16T00:00:00.000Z', 3, 300), // Exactly at toDate (excluded)
    ]

    const fromDate = new Date('2024-01-15T00:00:00Z')
    const toDate = new Date('2024-01-16T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    expect(result).toHaveLength(2)
    expect(result[0].count).toBe(1)
    expect(result[1].count).toBe(2)
  })

  it('should handle timezone-aware dates', () => {
    const events = [
      createMockEvent('2024-01-15T08:00:00Z', 1, 100), // 8 AM UTC
      createMockEvent('2024-01-15T16:00:00Z', 2, 200), // 4 PM UTC
    ]

    // Range in UTC
    const fromDate = new Date('2024-01-15T10:00:00Z') // 10 AM UTC
    const toDate = new Date('2024-01-15T18:00:00Z') // 6 PM UTC

    const result = getEventsInRange(events, fromDate, toDate)

    expect(result).toHaveLength(1)
    expect(result[0].count).toBe(2) // Only the 4 PM event
  })

  it('should preserve event properties', () => {
    const events = [
      {
        time: createMockTimestamp('2024-01-15T12:00:00Z'),
        count: 42,
        value: 999.99,
        customProperty: 'test',
      },
    ]

    const fromDate = new Date('2024-01-15T00:00:00Z')
    const toDate = new Date('2024-01-16T00:00:00Z')

    const result = getEventsInRange(events as any, fromDate, toDate)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      count: 42,
      value: 999.99,
      customProperty: 'test',
    })
  })

  it('should handle very large date ranges efficiently', () => {
    // Create many events
    const events = Array.from({ length: 1000 }, (_, i) =>
      createMockEvent(
        `2024-01-${String((i % 30) + 1).padStart(2, '0')}T12:00:00Z`,
        1,
        1,
      ),
    )

    const fromDate = new Date('2024-01-10T00:00:00Z')
    const toDate = new Date('2024-01-20T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    // Should efficiently filter without performance issues
    expect(result.length).toBeGreaterThan(0)
    expect(result.length).toBeLessThan(events.length)
  })

  it('should handle reverse date range gracefully', () => {
    const events = [createMockEvent('2024-01-15T12:00:00Z', 1, 100)]

    // toDate is before fromDate
    const fromDate = new Date('2024-01-16T00:00:00Z')
    const toDate = new Date('2024-01-15T00:00:00Z')

    const result = getEventsInRange(events, fromDate, toDate)

    // Should return empty array for invalid range
    expect(result).toHaveLength(0)
  })
})
