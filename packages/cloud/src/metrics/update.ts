import { firestore } from 'firebase-admin'
import { chunk, min } from 'lodash'
import { DateTime } from 'luxon'
import { getDatesInRange } from './events'

import { getMetricConfig } from './getMetricConfig'

// Generate a Firestore Timestamp from a Luxon DateTime.
const timestampFromDateTime = (dt: DateTime) =>
  firestore.Timestamp.fromMillis(dt.toMillis())

export const updateMetric = async (
  noun: string, // e.g., community
  verb: string, // e.g., check-in
  id: string, // e.g., the community ID
  dates: Date[], // The dates of the events to count.
) => {
  // Get the metric config for the given noun (e.g., "products").
  const config = await getMetricConfig(noun)

  // Get the time units to calculate from the config.
  // (e.g., ['hour', 'day'] will calculate hourly and daily totals.)
  const units = config?.units

  // We can't proceed without a unit.
  if (!units) throw new Error(`No units found for metric ${noun}`)

  // We can't proceed without dates.
  if (!dates.length) throw new Error('dates must be a non-empty array')

  // The start of the first block is the earliest date in the array.
  const minDate = min(dates) as Date

  // The end of the last block is the present time.
  const maxDate = new Date()

  const updates: any[] = []

  for (const unit of units) {
    // We start the cursor at the start of the first block.
    let cursor = DateTime.fromJSDate(minDate)

    // We iterate accross blocks until the cursor reaches the current time.
    while (cursor.toMillis() < maxDate.getTime()) {
      const start = cursor.startOf(unit)
      const end = cursor.endOf(unit)

      // Count the number of events that fall within the current block.
      const count = getDatesInRange(
        dates,
        start.toJSDate(),
        end.toJSDate(),
      ).length

      // We only need to write to Firestore if there are events in the block.
      if (count) {
        updates.push({
          docRef: firestore()
            .collection('metrics')
            .doc(noun)
            .collection(verb)
            .doc(id)
            .collection(unit)
            .doc(start.toJSON()),
          data: {
            start: timestampFromDateTime(start),
            end: timestampFromDateTime(end),
            count,
          },
        })
      }

      cursor = cursor.plus({ [unit]: 1 })
    }
  }

  const batches = chunk(updates, 500)
  for (const updateBatch of batches) {
    const batch = firestore().batch()
    for (const update of updateBatch) {
      batch.set(update.docRef, update.data)
    }
    await batch.commit()
  }
}
