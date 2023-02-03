import { firestore } from 'firebase-admin'
import { DateTime } from 'luxon'

import { getMetricConfig } from './getMetricConfig'

const DateTimeToTimestamp = (dt: DateTime) =>
  firestore.Timestamp.fromMillis(dt.toMillis())

export const incrementMetric = async (
  noun: string, // e.g., community
  verb: string, // e.g., check-in
  id: string, // e.g., the community ID
  value = 1,
) => {
  const now = new Date()
  const increment = firestore.FieldValue.increment(value)

  const config = await getMetricConfig(noun)
  if (!config?.units) throw new Error(`No units configured for ${noun}`)

  for (const unit of config.units) {
    const start = DateTime.fromJSDate(now).startOf(unit)
    const end = DateTime.fromJSDate(now).endOf(unit)

    firestore()
      .collection('metrics')
      .doc(noun)
      .collection(verb)
      .doc(id)
      .collection(unit)
      .doc(start.toJSON())
      .set(
        {
          start: DateTimeToTimestamp(start),
          end: DateTimeToTimestamp(end),
          count: increment,
        },
        { merge: true },
      )
  }
}
