import { TrackableEvent } from '../types'

export const getEventsInRange = (
  events: TrackableEvent[],
  fromDate: Date,
  toDate: Date,
) => events.filter(({ date }) => date >= fromDate && date < toDate)
