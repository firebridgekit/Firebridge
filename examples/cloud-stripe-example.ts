import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  onStripeCheckout,
  onStripePaymentIntent,
  stripeCheckoutWebhook,
  stripePaymentIntentWebhook,
  getStripe,
  Sellable,
  Checkout,
  CheckoutStatus
} from '@firebridge/cloud-stripe';

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore(app);

// Define your product data structure
interface Product extends Sellable {
  category: string;
  stockQuantity: number;
  isActive: boolean;
}

// Example 1: Setting up Stripe Checkout
// This creates a callable function that your frontend can call to create a checkout session

export const createCheckoutSession = onStripeCheckout({
  // Reference to your products collection
  itemsCollection: db.collection('products'),
  
  // Success URL - can be a string or function that returns a string
  successUrl: (orderReference: string) => 
    `https://yourapp.com/checkout/success?order=${orderReference}`,
  
  // Cancel URL when user cancels the checkout
  cancelUrl: 'https://yourapp.com/checkout/canceled'
});

// Example 2: Alternative checkout with dynamic success URL
export const createCheckoutWithDynamicUrl = onStripeCheckout({
  itemsCollection: db.collection('products'),
  
  // Dynamic success URL based on the order reference
  successUrl: (orderReference: string) => {
    // You can add custom logic here
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://yourapp.com' 
      : 'http://localhost:3000';
    return `${baseUrl}/order-confirmation/${orderReference}?utm_source=stripe`;
  },
  
  cancelUrl: 'https://yourapp.com/cart'
});

// Example 3: Payment Intent for more control over the payment flow
export const createPaymentIntent = onStripePaymentIntent({
  itemsCollection: db.collection('products'),
  
  // Optional: Custom processing logic
  onPaymentIntentCreated: async (paymentIntent, items, userId) => {
    console.log(`Payment intent created: ${paymentIntent.id}`);
    
    // You can add custom logic here, such as:
    // - Reserving inventory
    // - Creating a preliminary order
    // - Sending notifications
    
    await db.collection('payment_intents').doc(paymentIntent.id).set({
      userId,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      status: 'created',
      createdAt: new Date()
    });
  }
});

// Example 4: Stripe Checkout Webhook Handler
// This handles events from Stripe when checkout sessions change status

export const handleStripeCheckoutWebhook = stripeCheckoutWebhook(
  process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET, // Your webhook endpoint secret
  
  // Optional: Custom event handler
  async (event) => {
    console.log(`Received Stripe event: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        console.log(`Checkout completed: ${session.id}`);
        
        // Custom logic for successful checkout
        await handleSuccessfulCheckout(session);
        break;
        
      case 'checkout.session.expired':
        const expiredSession = event.data.object as any;
        console.log(`Checkout expired: ${expiredSession.id}`);
        
        // Custom logic for expired checkout
        await handleExpiredCheckout(expiredSession);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
);

// Example 5: Payment Intent Webhook Handler
export const handleStripePaymentWebhook = stripePaymentIntentWebhook(
  process.env.STRIPE_PAYMENT_WEBHOOK_SECRET,
  
  async (event) => {
    console.log(`Received payment event: ${event.type}`);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as any;
        await fulfillOrder(paymentIntent.id);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as any;
        await handlePaymentFailure(failedPayment.id);
        break;
    }
  }
);

// Example helper functions for webhook handlers

const handleSuccessfulCheckout = async (session: any) => {
  try {
    // Get the checkout record from Firestore
    const checkoutsSnapshot = await db.collection('checkouts')
      .where('session', '==', session.id)
      .limit(1)
      .get();
    
    if (checkoutsSnapshot.empty) {
      console.error('No checkout found for session:', session.id);
      return;
    }
    
    const checkoutDoc = checkoutsSnapshot.docs[0];
    const checkout = checkoutDoc.data() as Checkout;
    
    // Update checkout status
    await checkoutDoc.ref.update({
      status: 'completed' as CheckoutStatus,
      dateUpdated: new Date(),
      stripeCustomerId: session.customer,
      customerEmail: session.customer_details?.email
    });
    
    // Create order record
    await db.collection('orders').add({
      checkoutId: checkoutDoc.id,
      userId: checkout.uid,
      items: checkout.items,
      totalAmount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      status: 'confirmed',
      customerEmail: session.customer_details?.email,
      shippingAddress: session.shipping_details?.address,
      createdAt: new Date()
    });
    
    // Update inventory
    for (const item of checkout.items) {
      await db.collection('products').doc(item.id).update({
        stockQuantity: db.collection('products').doc(item.id).get()
          .then(doc => {
            const data = doc.data() as Product;
            return Math.max(0, data.stockQuantity - item.quantity);
          })
      });
    }
    
    // Send confirmation email (you would implement this)
    // await sendOrderConfirmationEmail(checkout.uid, checkoutDoc.id);
    
  } catch (error) {
    console.error('Error handling successful checkout:', error);
  }
}

const handleExpiredCheckout = async (session: any) => {
  try {
    // Find and update the expired checkout
    const checkoutsSnapshot = await db.collection('checkouts')
      .where('session', '==', session.id)
      .limit(1)
      .get();
    
    if (!checkoutsSnapshot.empty) {
      const checkoutDoc = checkoutsSnapshot.docs[0];
      await checkoutDoc.ref.update({
        status: 'expired' as CheckoutStatus,
        dateUpdated: new Date()
      });
    }
    
    // Optional: Send abandonment email
    // await sendCheckoutAbandonmentEmail(checkout.uid);
    
  } catch (error) {
    console.error('Error handling expired checkout:', error);
  }
}

const fulfillOrder = async (paymentIntentId: string) => {
  try {
    // Update payment intent record
    await db.collection('payment_intents').doc(paymentIntentId).update({
      status: 'succeeded',
      updatedAt: new Date()
    });
    
    // Get payment intent details from Stripe
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Create order fulfillment record
    await db.collection('fulfillments').add({
      paymentIntentId,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'pending',
      createdAt: new Date()
    });
    
  } catch (error) {
    console.error('Error fulfilling order:', error);
  }
}

const handlePaymentFailure = async (paymentIntentId: string) => {
  try {
    await db.collection('payment_intents').doc(paymentIntentId).update({
      status: 'failed',
      updatedAt: new Date()
    });
    
    // Optional: Send payment failure notification
    // await sendPaymentFailureNotification(paymentIntentId);
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Example 6: Using Stripe client directly for custom operations
export const createCustomCheckout = async (
  customerId: string,
  items: Array<{ productId: string; quantity: number }>
) {
  const stripe = getStripe();
  
  // Get product details
  const products = await Promise.all(
    items.map(async (item) => {
      const doc = await db.collection('products').doc(item.productId).get();
      const product = doc.data() as Product;
      return { ...product, quantity: item.quantity };
    })
  );
  
  // Create custom checkout session with additional options
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card', 'apple_pay', 'google_pay'],
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB']
    },
    shipping_options: [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: 599, // $5.99 shipping
            currency: 'usd'
          },
          display_name: 'Standard shipping',
          delivery_estimate: {
            minimum: {
              unit: 'business_day',
              value: 3
            },
            maximum: {
              unit: 'business_day',
              value: 7
            }
          }
        }
      }
    ],
    line_items: products.map(product => ({
      price_data: {
        currency: product.price.currency,
        product_data: {
          name: product.name,
          description: product.description,
          images: product.images
        },
        unit_amount: Math.floor(product.price.value * 100)
      },
      quantity: product.quantity
    })),
    mode: 'payment',
    success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://yourapp.com/cancel'
  });
  
  return session;
}