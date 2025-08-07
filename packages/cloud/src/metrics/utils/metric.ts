import { firestore } from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { DateTime, DateTimeUnit } from 'luxon'

import {
  firestoreDelete,
  firestoreGet,
  firestoreMerge,
  firestoreSet,
} from '../../actions'
import {
  MetricConfig,
  MetricEntitySummary,
  MetricTimelineSectionUpdates,
  MetricEntitySummaryUpdates,
} from '../types'

// Generate a Firestore Timestamp from a Luxon DateTime.
const timestampFromDateTime = (dt: DateTime) =>
  firestore.Timestamp.fromMillis(dt.toMillis())

export const firebridgeMetric = (noun: string, verb: string) => {
  const metricsPath = 'metrics'
  const metricName = `${noun}-${verb}`

  // Metric Config
  // -------------
  // The metric config relates to a specific noun-action pair. For example,
  // the metric config for "product" "purchase" would define how we should store
  // purchase events for our products.
  const metricUtils = {
    ref: firestore().collection(metricsPath).doc(metricName),
    get: async () => firestoreGet<MetricConfig>(metricsPath)(metricName),
    set: async (data: MetricConfig) =>
      firestoreSet<MetricConfig>(metricsPath)(metricName, data),
  }

  return {
    ...metricUtils,

    // Entity Summary
    // --------------
    // The entity summary is a single document that contains the summary of an
    // action for a given entity (e.g., all of the views for a specific product).
    entity: (entity: string) => {
      const entitiesPath = `${metricsPath}/${metricName}/entities`
      const entityUtils = {
        ref: firestore().collection(entitiesPath).doc(entity),
        get: async () =>
          firestoreGet<MetricEntitySummary>(entitiesPath)(entity),
        set: async (data: MetricEntitySummaryUpdates) =>
          firestoreSet<MetricEntitySummaryUpdates>(entitiesPath)(entity, data),
        delete: async () =>
          firestoreDelete(entitiesPath, { recursive: true })(entity),
        increment: async ({
          count = 1,
          value = 0,
        }: { count?: number; value?: number } = {}) => {
          const countIncrement = firestore.FieldValue.increment(count)
          const valueIncrement = firestore.FieldValue.increment(value)

          return firestoreMerge<MetricEntitySummaryUpdates>(entitiesPath)(
            entity,
            {
              count: countIncrement,
              value: valueIncrement,
              lastUpdated: firestore.Timestamp.now(),
            },
          )
        },
      }

      return {
        ...entityUtils,

        // Entity Timeline
        // --------------
        // An entity timeline is a collection of documents that each represent a
        // summary of events for a specific time period. For example, a document
        // might represent the total number of views for a product on a given day.
        // The units of time are defined in the metric config.
        timeline: (unit: DateTimeUnit, timezone: string = 'UTC') => {
          const timelinesPath = `${entitiesPath}/${entity}/timelines`
          const cursorsPath = `${timelinesPath}/${unit}/cursors`

          const makeCursorId = (time: Timestamp) => {
            const date = time.toDate()
            const id = DateTime.fromJSDate(date).setZone(timezone).startOf(unit).toJSON()
            if (!id) throw new Error('Invalid cursor ID')
            return id
          }

          const makeCursorPath = (time: Timestamp) =>
            `${cursorsPath}/${makeCursorId(time)}`

          return {
            cursor: {
              makeRef: (time: Timestamp) =>
                firestore().doc(makeCursorPath(time)),
              set: async (data: MetricTimelineSectionUpdates) =>
                firestoreSet<MetricTimelineSectionUpdates>(cursorsPath)(
                  makeCursorId(data.startTime),
                  data,
                ),
              increment: async (
                time: Timestamp,
                {
                  count = 1,
                  value = 0,
                }: { count?: number; value?: number } = {},
              ) => {
                const date = time.toDate()
                const start = DateTime.fromJSDate(date).setZone(timezone).startOf(unit)
                const end = DateTime.fromJSDate(date).setZone(timezone).endOf(unit)

                await entityUtils.increment({ count, value })

                // Since this is an increment operation, we can use the increment so that
                // we don't have to combine a read and a write operation.
                const countIncrement = firestore.FieldValue.increment(count)
                const valueIncrement = firestore.FieldValue.increment(value)

                return firestoreMerge<MetricTimelineSectionUpdates>(
                  timelinesPath,
                )(makeCursorId(time), {
                  startTime: timestampFromDateTime(start),
                  endTime: timestampFromDateTime(end),
                  count: countIncrement,
                  totalCount: countIncrement,
                  value: valueIncrement,
                  totalValue: valueIncrement,
                })
              },
            },
          }
        },
      }
    },
  }
}
