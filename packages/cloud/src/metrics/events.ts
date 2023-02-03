import { DateTime, DateTimeUnit } from 'luxon'
import { min, max } from 'lodash'

import { TimelineSection } from './types'

export const getDatesInRange = (dates: Date[], fromDate: Date, toDate: Date) =>
  dates.filter(date => date >= fromDate && date < toDate)

export const countDatesByUnit = (dates: Date[], unit: DateTimeUnit = 'day') => {
  const timeline: TimelineSection[] = []

  if (!dates.length) {
    return timeline
  }

  const start = DateTime.fromJSDate(min(dates) as Date).startOf(unit)
  const end = DateTime.fromJSDate(max(dates) as Date).endOf(unit)

  let cursor = start
  while (cursor < end) {
    const nextCursor = cursor.plus({ [unit]: 1 })
    const fromDate = cursor.toJSDate()
    const toDate = nextCursor.toJSDate()

    const sectionDates = getDatesInRange(dates, fromDate, toDate)

    timeline.push({
      start: cursor.toJSDate(),
      end: nextCursor.toJSDate(),
      count: sectionDates.length,
    })

    cursor = nextCursor
  }

  return timeline
}
