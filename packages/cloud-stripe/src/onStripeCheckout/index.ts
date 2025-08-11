import { customAlphabet } from 'nanoid'
import { CollectionReference } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { callableV2 } from '@firebridge/cloud'

import { Quanitifed, Sellable } from '../types'
import { setCheckout } from '../checkoutOperations'
import { chunk } from '../utils'
import { getStripe } from '../client'
import validation from './validation'

interface OnStripeCheckoutBody {
  cart: {
    id: string
    quantity: number
  }[]
  cancelUrl?: string
}

interface OnStripeCheckoutArgs {
  itemsCollection: CollectionReference
  successUrl: (orderReference: string) => string | string
  cancelUrl: string
}

export const onStripeCheckout = ({
  itemsCollection,
  successUrl,
  cancelUrl,
}: OnStripeCheckoutArgs) =>
  callableV2<OnStripeCheckoutBody, any>({
    validation,
    action: async body => {
      const { cart, cancelUrl: overrideCancelUrl } = body.data
      const user = await getAuth().getUser(body.auth.uid)

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

      // https://zelark.github.io/nano-id-cc/
      const referenceCode = customAlphabet(
        '2345678ABCDEFGHJKMNPQRSTUVWXYZ',
        12,
      )()

      // turns XXXXXXXXXXXX into XXXX-XXXX-XXXX
      const chunkedReferenceCode = chunk(referenceCode.split(''), 4)
        .map(part => part.join(''))
        .join('-')

      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: user?.email || undefined,
        phone_number_collection: { enabled: true },
        line_items: items.map(
          ({ quantity, name, description, images, price }) => ({
            quantity,
            name,
            description,
            images,
            amount: Math.floor(price.value * 100),
            currency: price.currency,
          }),
        ),
        success_url:
          typeof successUrl === 'function'
            ? successUrl(chunkedReferenceCode)
            : successUrl,
        cancel_url: overrideCancelUrl ?? cancelUrl,
      })

      await setCheckout(chunkedReferenceCode, {
        session: session.id,
        uid: body.auth.uid,
        status: 'created',
        items,
        itemIds: items.map(({ id }) => id),
        dateCreated: new Date(),
        dateUpdated: new Date(),
      })

      return { session }
    },
  })
