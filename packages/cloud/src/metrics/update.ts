import { firestore } from 'firebase-admin'
import { min } from 'lodash'
import { DateTime } from 'luxon'
import { getDatesInRange } from './events'

import { getMetricConfig } from './getMetricConfig'

const timestampFromDateTime = (dt: DateTime) =>
  firestore.Timestamp.fromMillis(dt.toMillis())

export const updateMetric = async (
  noun: string, // e.g., community
  verb: string, // e.g., check-in
  id: string, // e.g., the community ID
  dates: Date[],
) => {
  const config = await getMetricConfig(noun)
  const units = config?.units

  if (!units) {
    throw new Error(`No units found for metric ${noun}`)
  }

  if (!dates.length) {
    throw new Error('dates must be a non-empty array')
  }

  const minDate = min(dates) as Date
  const maxDate = new Date()

  for (const unit of units) {
    let cursor = DateTime.fromJSDate(minDate)

    // We iterate accross blocks until the cursor reaches the current time.
    while (cursor.toMillis() < maxDate.getTime()) {
      const start = cursor.startOf(unit)
      const end = cursor.endOf(unit)
      const count = getDatesInRange(dates, start.toJSDate(), end.toJSDate())
        .length

      if (count) {
        await firestore()
          .collection('metrics')
          .doc(noun)
          .collection(verb)
          .doc(id)
          .collection(unit)
          .doc(start.toJSON())
          .set(
            {
              start: timestampFromDateTime(start),
              end: timestampFromDateTime(end),
              count,
            },
            { merge: true },
          )
      }

      cursor = cursor.plus({ [unit]: 1 })
    }
  }
}
