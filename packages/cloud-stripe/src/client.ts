import Stripe from 'stripe'
import { defineString } from 'firebase-functions/params'

const stripeSecret = defineString('STRIPE_SECRET', {
  label: 'Stripe Secret',
  description: 'Stripe secret key',
})

const stripeApiVersion = defineString('STRIPE_API_VERSION', {
  label: 'Stripe API Version',
  description: 'Stripe API version',
  default: '2022-11-15',
})

export const getStripe = () =>
  new Stripe(stripeSecret.value(), {
    apiVersion: stripeApiVersion.value() as '2022-11-15',
  })
