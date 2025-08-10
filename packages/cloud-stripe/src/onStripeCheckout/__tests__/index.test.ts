import { onStripeCheckout } from '../index';
import { getStripe } from '../../client';
import { setCheckout } from '../../checkoutOperations';
import { getAuth } from 'firebase-admin/auth';
import { customAlphabet } from 'nanoid';
import { callableV2 } from '@firebridge/cloud';

// Mock dependencies
jest.mock('../../client');
jest.mock('../../checkoutOperations', () => ({
  setCheckout: jest.fn(),
  getCheckout: jest.fn(),
  updateCheckout: jest.fn(),
  getCheckoutBySession: jest.fn(),
  getCheckouts: jest.fn(),
}));
jest.mock('firebase-admin/auth');
jest.mock('nanoid');

// Mock @firebridge/cloud
jest.mock('@firebridge/cloud');

describe('onStripeCheckout', () => {
  const mockItemsCollection = {
    doc: jest.fn(),
  };

  const mockDoc = {
    get: jest.fn(),
  };

  const mockStripe = {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  };

  const mockAuth = {
    getUser: jest.fn(),
  };

  const mockCallableContext = {
    auth: { uid: 'test-user-123' },
    data: {
      cart: [
        { id: 'item-1', quantity: 2 },
        { id: 'item-2', quantity: 1 },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    
    // Setup default mocks
    (getStripe as jest.Mock).mockReturnValue(mockStripe);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);
    (customAlphabet as jest.Mock).mockReturnValue(() => 'ABCD1234WXYZ');
    (setCheckout as jest.Mock).mockResolvedValue(undefined);
    mockItemsCollection.doc.mockReturnValue(mockDoc);
    mockAuth.getUser.mockResolvedValue({ email: 'test@example.com' });
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_session_123',
      url: 'https://checkout.stripe.com/session',
    });
    
    // Mock callableV2 to extract and return the action
    (callableV2 as jest.Mock).mockImplementation((options: any) => {
      // Return the action directly for testing
      return options.action;
    });
  });

  describe('successful checkout creation', () => {
    it('should create a checkout session with correct parameters', async () => {
      // Setup
      mockDoc.get.mockResolvedValueOnce({
        data: () => ({
          name: 'Product 1',
          description: 'Test product 1',
          images: ['https://example.com/image1.jpg'],
          price: { value: 10.00, currency: 'usd' },
        }),
      });
      mockDoc.get.mockResolvedValueOnce({
        data: () => ({
          name: 'Product 2',
          description: 'Test product 2',
          images: ['https://example.com/image2.jpg'],
          price: { value: 20.00, currency: 'usd' },
        }),
      });

      // Create the handler
      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: (ref) => `https://example.com/success?ref=${ref}`,
        cancelUrl: 'https://example.com/cancel',
      });

      // Execute the handler (which is the action due to our mock)
      const result = await handler(mockCallableContext);

      // Verify
      expect(mockAuth.getUser).toHaveBeenCalledWith('test-user-123');
      expect(mockItemsCollection.doc).toHaveBeenCalledWith('item-1');
      expect(mockItemsCollection.doc).toHaveBeenCalledWith('item-2');
      
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        customer_email: 'test@example.com',
        phone_number_collection: { enabled: true },
        line_items: [
          {
            quantity: 2,
            name: 'Product 1',
            description: 'Test product 1',
            images: ['https://example.com/image1.jpg'],
            amount: 1000, // $10.00 * 100
            currency: 'usd',
          },
          {
            quantity: 1,
            name: 'Product 2',
            description: 'Test product 2',
            images: ['https://example.com/image2.jpg'],
            amount: 2000, // $20.00 * 100
            currency: 'usd',
          },
        ],
        success_url: 'https://example.com/success?ref=ABCD-1234-WXYZ',
        cancel_url: 'https://example.com/cancel',
      });

      expect(setCheckout).toHaveBeenCalledWith('ABCD-1234-WXYZ', {
        session: 'cs_test_session_123',
        uid: 'test-user-123',
        status: 'created',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'item-1',
            quantity: 2,
            name: 'Product 1',
          }),
          expect.objectContaining({
            id: 'item-2',
            quantity: 1,
            name: 'Product 2',
          }),
        ]),
        itemIds: ['item-1', 'item-2'],
        dateCreated: expect.any(Date),
        dateUpdated: expect.any(Date),
      });

      expect(result).toEqual({ session: { id: 'cs_test_session_123', url: 'https://checkout.stripe.com/session' } });
    });

    it('should handle static success URL', async () => {
      // Setup
      mockDoc.get.mockResolvedValue({
        data: () => ({
          name: 'Product',
          description: 'Test product',
          images: [],
          price: { value: 15.00, currency: 'eur' },
        }),
      });

      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: 'https://example.com/static-success',
        cancelUrl: 'https://example.com/cancel',
      });

      // Execute the handler
      await handler(mockCallableContext);

      // Verify
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://example.com/static-success',
        })
      );
    });

    it('should use override cancel URL when provided', async () => {
      // Setup
      mockDoc.get.mockResolvedValue({
        data: () => ({
          name: 'Product',
          description: 'Test product',
          images: [],
          price: { value: 25.00, currency: 'gbp' },
        }),
      });

      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      const contextWithOverride = {
        ...mockCallableContext,
        data: {
          ...mockCallableContext.data,
          cancelUrl: 'https://example.com/override-cancel',
        },
      };

      // Execute the handler
      await handler(contextWithOverride);

      // Verify
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cancel_url: 'https://example.com/override-cancel',
        })
      );
    });
  });

  describe('reference code generation', () => {
    it('should generate and format reference code correctly', async () => {
      // Setup
      mockDoc.get.mockResolvedValue({
        data: () => ({
          name: 'Product',
          description: 'Test',
          images: [],
          price: { value: 10, currency: 'usd' },
        }),
      });

      (customAlphabet as jest.Mock).mockReturnValue(() => '2A3B4C5D6E7F');

      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: (ref) => `https://example.com/success/${ref}`,
        cancelUrl: 'https://example.com/cancel',
      });

      // Execute the handler
      await handler(mockCallableContext);

      // Verify
      expect(customAlphabet).toHaveBeenCalledWith(
        '2345678ABCDEFGHJKMNPQRSTUVWXYZ',
        12
      );
      
      expect(setCheckout).toHaveBeenCalledWith(
        '2A3B-4C5D-6E7F', // Properly chunked
        expect.any(Object)
      );

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://example.com/success/2A3B-4C5D-6E7F',
        })
      );
    });
  });

  describe('user handling', () => {
    it('should handle user without email', async () => {
      // Setup
      mockDoc.get.mockResolvedValue({
        data: () => ({
          name: 'Product',
          description: 'Test',
          images: [],
          price: { value: 10, currency: 'usd' },
        }),
      });

      mockAuth.getUser.mockResolvedValue({ uid: 'test-user-123' }); // No email

      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      // Execute the handler
      await handler(mockCallableContext);

      // Verify
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: undefined,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should propagate errors from item collection fetch', async () => {
      // Setup
      const fetchError = new Error('Failed to fetch item');
      mockDoc.get.mockRejectedValue(fetchError);

      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      // Execute & Verify
      await expect(handler(mockCallableContext)).rejects.toThrow(
        'Failed to fetch item'
      );
    });

    it('should propagate errors from Stripe session creation', async () => {
      // Setup
      mockDoc.get.mockResolvedValue({
        data: () => ({
          name: 'Product',
          description: 'Test',
          images: [],
          price: { value: 10, currency: 'usd' },
        }),
      });

      const stripeError = new Error('Stripe API error');
      mockStripe.checkout.sessions.create.mockRejectedValue(stripeError);

      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      // Execute & Verify
      await expect(handler(mockCallableContext)).rejects.toThrow(
        'Stripe API error'
      );
    });

    it('should propagate errors from checkout save operation', async () => {
      // Setup
      mockDoc.get.mockResolvedValue({
        data: () => ({
          name: 'Product',
          description: 'Test',
          images: [],
          price: { value: 10, currency: 'usd' },
        }),
      });

      const saveError = new Error('Failed to save checkout');
      (setCheckout as jest.Mock).mockRejectedValue(saveError);

      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      // Execute & Verify
      await expect(handler(mockCallableContext)).rejects.toThrow(
        'Failed to save checkout'
      );
    });
  });

  describe('price calculations', () => {
    it('should correctly convert prices to cents', async () => {
      // Setup
      mockDoc.get.mockResolvedValueOnce({
        data: () => ({
          name: 'Product 1',
          description: 'Test',
          images: [],
          price: { value: 10.99, currency: 'usd' },
        }),
      });
      mockDoc.get.mockResolvedValueOnce({
        data: () => ({
          name: 'Product 2',
          description: 'Test',
          images: [],
          price: { value: 0.50, currency: 'usd' },
        }),
      });

      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      // Execute the handler
      await handler(mockCallableContext);

      // Verify
      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(createCall.line_items[0].amount).toBe(1099); // $10.99 -> 1099 cents
      expect(createCall.line_items[1].amount).toBe(50);   // $0.50 -> 50 cents
    });

    it('should handle rounding for fractional cents', async () => {
      // Setup
      mockDoc.get.mockResolvedValue({
        data: () => ({
          name: 'Product',
          description: 'Test',
          images: [],
          price: { value: 10.999, currency: 'usd' }, // Should round down
        }),
      });

      const handler = onStripeCheckout({
        itemsCollection: mockItemsCollection as any,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      // Execute the handler
      await handler({
        auth: { uid: 'test-user-123' },
        data: { cart: [{ id: 'item-1', quantity: 1 }] },
      });

      // Verify
      const createCall = mockStripe.checkout.sessions.create.mock.calls[0][0];
      expect(createCall.line_items[0].amount).toBe(1099); // Math.floor(10.999 * 100)
    });
  });
});