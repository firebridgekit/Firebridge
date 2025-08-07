import { Timestamp } from 'firebase-admin/firestore'
import { buildTimeline } from '../utils/buildTimeline'
import { TrackableEvent } from '../types'

// Helper functions
const createMockEvent = (
  isoString: string,
  count: number,
  value: number,
): TrackableEvent => ({
  time: Timestamp.fromDate(new Date(isoString)),
  count,
  value,
})

const createMockTimestamp = (isoString: string): Timestamp =>
  Timestamp.fromDate(new Date(isoString))

describe('Simple metrics tests', () => {
  it('should create basic timeline', () => {
    const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)]

    const result = buildTimeline(events, { unit: 'day' })

    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })

  it('should handle timezone parameter', () => {
    const events = [createMockEvent('2024-01-15T10:00:00Z', 1, 100)]

    const result = buildTimeline(events, {
      unit: 'day',
      timezone: 'America/New_York',
    })

    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
  })

  it('should use mock timestamp utility', () => {
    const timestamp = createMockTimestamp('2024-01-15T10:00:00Z')

    expect(timestamp.toDate()).toBeInstanceOf(Date)
    expect(timestamp.toMillis()).toBe(
      new Date('2024-01-15T10:00:00Z').getTime(),
    )
  })

  it('should use mock event utility', () => {
    const event = createMockEvent('2024-01-15T10:00:00Z', 5, 500)

    expect(event.count).toBe(5)
    expect(event.value).toBe(500)
    expect(event.time.toDate()).toBeInstanceOf(Date)
  })
})
