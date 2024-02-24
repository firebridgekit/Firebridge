import Stripe from 'stripe'
import { onRequest } from 'firebase-functions/v2/https'

import { getStripe } from '../client'
import { updateCheckout, getCheckout } from '../checkoutOperations'
import {
  AcceptedPaymentIntentEvent,
  acceptedPaymentIntentEvents,
  checkoutStatusByEvent,
} from './events'

export const stripePaymentIntentWebhook = (
  endpointSecret?: string,
  onReceived?: (event: Stripe.Event) => void | Promise<void>,
) =>
  onRequest(async (req, res) => {
    try {
      if (req.method !== 'POST') {
        throw new Error('webhook called with a method other than POST')
      }

      const stripeSignature = req.headers['stripe-signature']
      if (!stripeSignature) {
        throw new Error('missing "stripe-signature" header')
      }

      if (!endpointSecret) {
        throw new Error('missing endpoint secret')
      }

      // validate the webhook
      const event = getStripe().webhooks.constructEvent(
        req.rawBody,
        stripeSignature,
        endpointSecret,
      )

      if (acceptedPaymentIntentEvents.includes(event.type)) {
        const eventType = event.type as AcceptedPaymentIntentEvent
        const payment = event.data.object as Stripe.PaymentIntent

        const checkout = await getCheckout(payment.id)
        if (!checkout) {
          throw new Error('no checkout found for payment')
        }

        // perform automatic checkout record updates
        await updateCheckout(checkout.id, {
          status: checkoutStatusByEvent[eventType],
        })
      }

      // perform the provided checkout action
      if (onReceived) {
        await onReceived(event)
      }

      res.json({ received: true })
    } catch (error) {
      res.status(400).send(`Webhook Error: ${(error as any).message}`)
      if (
        ![
          'webhook called with a method other than POST',
          'missing "stripe-signature" header',
        ].includes((error as any).message)
      ) {
        console.error(error)
      }
    }
  })
