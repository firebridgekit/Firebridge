import { sumBy } from 'lodash'
import Stripe from 'stripe'
import { callableV2 } from '@firebridge/cloud'
import { CollectionReference } from 'firebase-admin/firestore'

import { Quanitifed, Sellable } from '../types'
import { setCheckout } from '../checkoutOperations'
import validation from './validation'
import { getStripe } from '../client'

type Body = {
  cart: {
    id: string
    quantity: number
  }[]
}

type Response = {
  clientSecret: string
}

type Args = {
  itemsCollection: CollectionReference
}

export const onStripePaymentIntent = ({ itemsCollection }: Args) =>
  callableV2<Body, Response>({
    validation,
    action: async body => {
      const stripe = getStripe()

      const { cart } = body.data

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
        uid: body.auth.uid,
        status: 'created',
        items,
        itemIds: items.map(({ id }) => id),
        dateCreated: new Date(),
        dateUpdated: new Date(),
      })

      if (!paymentIntent.client_secret) {
        throw new Error('client_secret is missing')
      }

      return { clientSecret: paymentIntent.client_secret }
    },
  })
