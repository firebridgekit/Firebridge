declare global {
  var createMockTimestamp: (date: string | Date) => any;
  var createMockCheckoutSession: (overrides?: any) => any;
  var createMockPaymentIntent: (overrides?: any) => any;
}

export {};