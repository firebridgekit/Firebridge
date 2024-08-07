import { TrackableEvent } from '../types'

export const getEventsInRange = (
  events: TrackableEvent[],
  fromDate: Date,
  toDate: Date,
) =>
  events.filter(({ time }) => {
    const date = time.toDate()
    return date >= fromDate && date < toDate
  })
