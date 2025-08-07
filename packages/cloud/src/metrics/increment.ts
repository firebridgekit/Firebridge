import { firestore } from 'firebase-admin'

import { firebridgeMetric } from './utils'

export const incrementMetric = async (
  noun: string, // e.g., product
  action: string, // e.g., purchase
  entity: string, // e.g., the product ID
  {
    count = 1,
    value = 1,
    time = firestore.Timestamp.now(),
  }: {
    count?: number
    value?: number
    time?: firestore.Timestamp
  },
) => {
  const metric = firebridgeMetric(noun, action)
  const metricEntity = metric.entity(entity)

  // The metric config relates to a specific noun-action pair. For example,
  // the metric config for "product" "purchase" would define how we should store
  // purchase events for our products.
  const actionConfig = await metric.get()
  const { units = [], timezone = 'UTC' } = actionConfig ?? {}

  // For each unit, we'll increment the count and value.
  // A unit could be "hour", "day", "week", "month", etc.
  // The levels of granularity are defined in the metric config.
  for (const unit of units) {
    await metricEntity.timeline(unit, timezone).cursor.increment(time, { count, value })
  }
}
