import { firestore } from 'firebase-admin'
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
  MetricTimelineSection,
  MetricTimelineSectionUpdates,
  MetricEntitySummaryUpdates,
} from '../types'

// Generate a Firestore Timestamp from a Luxon DateTime.
const timestampFromDateTime = (dt: DateTime) =>
  firestore.Timestamp.fromMillis(dt.toMillis())

const makeMetricPath = (noun: string) => `metrics/${noun}`

const makeActionsPath = (noun: string) => `${makeMetricPath(noun)}/actions`

const makeEntitiesPath = (noun: string, action: string) =>
  `${makeActionsPath(noun)}/${action}/entities`

const makeUnitsPath = (noun: string, action: string, entity: string) =>
  `${makeEntitiesPath(noun, action)}/${entity}/units`

export const firebridgeMetric = (noun: string, action: string) => {
  const actionsPath = makeActionsPath(noun)

  // Metric Config
  // -------------
  // The metric config relates to a specific noun-action pair. For example,
  // the metric config for "product" "purchase" would define how we should store
  // purchase events for our products.
  const configUtils = {
    ref: `${actionsPath}/${action}`,
    get: async () => firestoreGet<MetricConfig>(actionsPath)(action),
    set: async (data: MetricConfig) =>
      firestoreSet<MetricConfig>(actionsPath)(action, data),
  }

  return {
    ...configUtils,

    // Entity Summary
    // --------------
    // The entity summary is a single document that contains the summary of an
    // action for a given entity (e.g., all of the views for a specific product).
    entity: (entity: string) => {
      const entitiesPath = makeEntitiesPath(noun, action)
      const entityUtils = {
        ref: `${entitiesPath}/${entity}`,
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
        timeline: (unit: DateTimeUnit) => {
          const unitsPath = makeUnitsPath(noun, action, entity)

          return {
            ref: `${unitsPath}/${unit}`,
            get: async () =>
              firestoreGet<MetricTimelineSection>(unitsPath)(unit),
            set: async (data: MetricTimelineSectionUpdates) =>
              firestoreSet<MetricTimelineSectionUpdates>(unitsPath)(unit, data),
            increment: async (
              date: Date,
              { count = 1, value = 0 }: { count?: number; value?: number } = {},
            ) => {
              const start = DateTime.fromJSDate(date).startOf(unit)
              const end = DateTime.fromJSDate(date).endOf(unit)

              await entityUtils.increment({ count, value })

              // Since this is an increment operation, we can use the increment so that
              // we don't have to combine a read and a write operation.
              const countIncrement = firestore.FieldValue.increment(count)
              const valueIncrement = firestore.FieldValue.increment(value)

              return firestoreMerge<MetricTimelineSectionUpdates>(unitsPath)(
                unit,
                {
                  startTime: timestampFromDateTime(start),
                  endTime: timestampFromDateTime(end),
                  count: countIncrement,
                  totalCount: countIncrement,
                  value: valueIncrement,
                  totalValue: valueIncrement,
                },
              )
            },
          }
        },
      }
    },
  }
}
