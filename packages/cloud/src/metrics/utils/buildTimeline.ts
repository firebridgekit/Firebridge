import { Timestamp } from 'firebase-admin/firestore'
import { DateTime, DateTimeUnit } from 'luxon'

import { MetricTimelineSection, TrackableEvent } from '../types'
import { sumBy } from '../../utils/sum'
import { getEventsInRange } from './getEventsInRange'

export const buildTimeline = (
  events: TrackableEvent[],
  {
    unit = 'day',
    startingCount = 0,
    startingValue = 0,
  }: {
    unit?: DateTimeUnit
    startingCount?: number
    startingValue?: number
  } = {},
) => {
  const timeline: MetricTimelineSection[] = []

  if (!events.length) {
    return timeline
  }

  let currentCount = startingCount
  let currentValue = startingValue

  const sortedEvents = (events ?? []).sort((a, b) => (a.date > b.date ? 1 : -1))
  const firstEvent = sortedEvents[0]
  const lastEvent = sortedEvents[sortedEvents.length - 1]

  const start = DateTime.fromJSDate(firstEvent.date).startOf(unit)
  const end = DateTime.fromJSDate(lastEvent.date).endOf(unit)

  let cursor = start
  while (cursor < end) {
    const nextCursor = cursor.plus({ [unit]: 1 })
    const fromDate = cursor.toJSDate()
    const toDate = nextCursor.toJSDate()

    let sectionEvents = getEventsInRange(events, fromDate, toDate)

    // Apply defaults to events.
    sectionEvents = sectionEvents.map(event => ({
      ...event,
      count: event.count ?? 1,
      value: event.value ?? 0,
    }))

    const count = sumBy(sectionEvents, 'count')
    const value = sumBy(sectionEvents, 'value')

    currentCount += count
    currentValue += value

    timeline.push({
      startTime: Timestamp.fromDate(cursor.toJSDate()),
      endTime: Timestamp.fromDate(nextCursor.toJSDate()),
      count,
      value,
      totalCount: currentCount,
      totalValue: currentValue,
    })

    cursor = nextCursor
  }

  return timeline
}
