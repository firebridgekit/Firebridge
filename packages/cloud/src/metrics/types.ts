import { firestore } from 'firebase-admin'
import { DateTimeUnit } from 'luxon'

export interface TimelineSection {
  start: Date
  end: Date
  count: number
}

export interface MetricConfig {
  units: DateTimeUnit[]
  dateUpdated?: firestore.Timestamp
}
