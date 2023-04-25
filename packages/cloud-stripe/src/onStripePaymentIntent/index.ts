import * as yup from 'yup'
import { firestore } from 'firebase-admin'
import { sumBy } from 'lodash'
import { callable } from '@firebridge/cloud'

import { Quanitifed, Sellable } from '../types'
import { setCheckout } from '../checkoutOperations'
import { stripe } from '../client'

interface OnStripePaymentIntentBody {
  cart: {
    id: string
    quantity: number
  }[]
}

interface OnStripePaymentIntentArgs {
  itemsCollection: firestore.CollectionReference
}

export const onStripePaymentIntent = ({
  itemsCollection,
}: OnStripePaymentIntentArgs) =>
  callable<OnStripePaymentIntentBody, any>({
    validation: yup.object({
      cart: yup.array(
        yup.object({
          id: yup.string().required(),
          quantity: yup.number().integer().required(),
        }),
      ),
    }),
    action: async ({ cart }, ctx) => {
      const getSellableItem = async ({
        id,
        quantity,
      }: {
        id: string
        quantity: number
      }) => {
        const doc = await itemsCollection.doc(id).get()
        return { ...doc.data(), quantity, id } as Sellable & Quanitifed
      }

      const items = await Promise.all(cart.map(getSellableItem))

      const paymentIntent = await stripe.paymentIntents.create({
        amount: sumBy(items, ({ price, quantity }) =>
          Math.floor(price.value * quantity * 100),
        ),
        currency: 'cad',
      })

      await setCheckout(paymentIntent.id, {
        payment: paymentIntent.id,
        uid: ctx.auth.uid,
        status: 'created',
        items,
        itemIds: items.map(({ id }) => id),
      })

      return { clientSecret: paymentIntent.client_secret }
    },
  })
