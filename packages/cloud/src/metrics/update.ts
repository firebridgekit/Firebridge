import { firestore } from 'firebase-admin'

import { FirestoreOperation, executeFirestoreBatch } from '../execution'
import { buildTimeline, firebridgeMetric } from './utils'
import { TrackableEvent } from './types'

export const updateMetric = async (
  noun: string, // e.g., product
  action: string, // e.g., purchase
  entity: string, // e.g., the product ID
  events: TrackableEvent[], // The events to sum.
  {
    startingCount = 0,
    startingValue = 0,
    clean = true, // If true, delete all existing data.
  }: {
    startingCount?: number
    startingValue?: number
    clean?: boolean
  } = {},
) => {
  // If there are no events, there's nothing to do.
  if (!events.length) {
    return
  }

  const metric = firebridgeMetric(noun, action)
  const metricEntity = metric.entity(entity)

  // The metric config relates to a specific noun-action pair. For example,
  // the metric config for "product" "purchase" would define how we should store
  // purchase events for our products.
  const actionConfig = await metric.get()
  const { units = [], timezone = 'UTC' } = actionConfig ?? {}

  const updates: FirestoreOperation[] = []

  if (clean) {
    await metricEntity.delete()
  }

  for (const unit of units) {
    const timeline = buildTimeline(events, {
      unit,
      timezone,
      startingCount,
      startingValue,
    })

    const cursor = metricEntity.timeline(unit).cursor
    const unitUpdates: FirestoreOperation[] = timeline.map(data => ({
      type: 'set',
      ref: cursor.makeRef(data.startTime),
      data,
    }))

    updates.push(...unitUpdates)
  }

  await executeFirestoreBatch(updates)

  await metricEntity.set({
    lastUpdated: firestore.Timestamp.now(),
    count:
      updates.length > 0
        ? updates[updates.length - 1].data.totalCount
        : undefined,
    value:
      updates.length > 0
        ? updates[updates.length - 1].data.totalValue
        : undefined,
  })
}
