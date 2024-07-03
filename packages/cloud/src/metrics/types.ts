import { firestore } from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { DateTimeUnit } from 'luxon'

export type MetricAddress = {
  noun: string
  action: string
  entity: string
}

export type MetricEntitySummary = {
  count: number
  value: number
  lastUpdated: Timestamp
}

export type MetricEntitySummaryUpdates = Omit<
  MetricEntitySummary,
  'count' | 'value'
> & {
  count: number | firestore.FieldValue
  value: number | firestore.FieldValue
}

export type MetricTimelineSection = {
  startTime: Timestamp
  endTime: Timestamp
  totalCount: number
  totalValue: number
  count: number
  value: number
}

export type MetricTimelineSectionUpdates = Omit<
  MetricTimelineSection,
  'count' | 'value' | 'totalCount' | 'totalValue'
> & {
  totalCount: number | firestore.FieldValue
  totalValue: number | firestore.FieldValue
  count: number | firestore.FieldValue
  value: number | firestore.FieldValue
}

export type MetricConfig = {
  units: DateTimeUnit[]
  dateUpdated?: Timestamp
}

export type TrackableEvent = {
  time: Timestamp
  count?: number
  value?: number
}
