import { sumBy } from '../sumBy';

describe('sumBy', () => {
  describe('using property key', () => {
    it('should sum numeric property values', () => {
      const items = [
        { price: 10, quantity: 2 },
        { price: 20, quantity: 1 },
        { price: 15, quantity: 3 },
      ];
      
      const result = sumBy(items, 'price');
      expect(result).toBe(45);
    });

    it('should sum another property', () => {
      const items = [
        { price: 10, quantity: 2 },
        { price: 20, quantity: 1 },
        { price: 15, quantity: 3 },
      ];
      
      const result = sumBy(items, 'quantity');
      expect(result).toBe(6);
    });

    it('should handle decimal values', () => {
      const items = [
        { value: 10.5 },
        { value: 20.25 },
        { value: 15.75 },
      ];
      
      const result = sumBy(items, 'value');
      expect(result).toBe(46.5);
    });

    it('should handle negative values', () => {
      const items = [
        { balance: 100 },
        { balance: -50 },
        { balance: 25 },
      ];
      
      const result = sumBy(items, 'balance');
      expect(result).toBe(75);
    });
  });

  describe('using function selector', () => {
    it('should sum using a function selector', () => {
      const items = [
        { price: 10, quantity: 2 },
        { price: 20, quantity: 1 },
        { price: 15, quantity: 3 },
      ];
      
      const result = sumBy(items, item => item.price * item.quantity);
      expect(result).toBe(20 + 20 + 45); // 85
    });

    it('should handle complex calculations', () => {
      const items = [
        { base: 100, tax: 0.1 },
        { base: 200, tax: 0.15 },
        { base: 150, tax: 0.2 },
      ];
      
      const result = sumBy(items, item => item.base * (1 + item.tax));
      expect(result).toBe(110 + 230 + 180); // 520
    });

    it('should handle conditional logic in selector', () => {
      const items = [
        { value: 10, active: true },
        { value: 20, active: false },
        { value: 15, active: true },
      ];
      
      const result = sumBy(items, item => item.active ? item.value : 0);
      expect(result).toBe(25);
    });

    it('should handle property access in function', () => {
      const items = [
        { nested: { value: 10 } },
        { nested: { value: 20 } },
        { nested: { value: 15 } },
      ];
      
      const result = sumBy(items, item => item.nested.value);
      expect(result).toBe(45);
    });
  });

  describe('edge cases', () => {
    it('should return 0 for empty array', () => {
      const result = sumBy([], 'value');
      expect(result).toBe(0);
    });

    it('should return 0 for empty array with function', () => {
      const result = sumBy([], item => (item as any).value);
      expect(result).toBe(0);
    });

    it('should handle single item array', () => {
      const items = [{ value: 42 }];
      const result = sumBy(items, 'value');
      expect(result).toBe(42);
    });

    it('should handle zero values', () => {
      const items = [
        { value: 0 },
        { value: 0 },
        { value: 0 },
      ];
      
      const result = sumBy(items, 'value');
      expect(result).toBe(0);
    });

    it('should handle mixed positive and negative resulting in zero', () => {
      const items = [
        { value: 10 },
        { value: -5 },
        { value: -5 },
      ];
      
      const result = sumBy(items, 'value');
      expect(result).toBe(0);
    });
  });

  describe('type handling', () => {
    it('should work with different numeric types', () => {
      const items = [
        { int: 10, float: 10.5 },
        { int: 20, float: 20.25 },
      ];
      
      expect(sumBy(items, 'int')).toBe(30);
      expect(sumBy(items, 'float')).toBe(30.75);
    });

    it('should handle undefined values', () => {
      const items = [
        { value: 10 },
        { value: undefined as any },
        { value: 20 },
      ];
      
      const result = sumBy(items, 'value');
      expect(result).toBeNaN(); // undefined in arithmetic results in NaN
    });

    it('should handle NaN in calculations', () => {
      const items = [
        { value: 10 },
        { value: NaN },
        { value: 20 },
      ];
      
      const result = sumBy(items, 'value');
      expect(result).toBeNaN();
    });
  });

  describe('practical use cases', () => {
    it('should calculate shopping cart total', () => {
      const cart = [
        { product: 'Laptop', price: 999.99, quantity: 1 },
        { product: 'Mouse', price: 29.99, quantity: 2 },
        { product: 'Keyboard', price: 89.99, quantity: 1 },
      ];
      
      const total = sumBy(cart, item => item.price * item.quantity);
      expect(total).toBeCloseTo(1149.96, 2);
    });

    it('should calculate total with discounts', () => {
      const items = [
        { price: 100, discount: 0.1 }, // 10% off
        { price: 50, discount: 0.2 },  // 20% off
        { price: 75, discount: 0 },    // no discount
      ];
      
      const total = sumBy(items, item => item.price * (1 - item.discount));
      expect(total).toBe(90 + 40 + 75); // 205
    });

    it('should sum Stripe amounts in cents', () => {
      // Simulating Stripe price conversion
      const items = [
        { price: { value: 10.00, currency: 'usd' } },
        { price: { value: 20.50, currency: 'usd' } },
        { price: { value: 15.99, currency: 'usd' } },
      ];
      
      const totalCents = sumBy(items, item => Math.floor(item.price.value * 100));
      expect(totalCents).toBe(1000 + 2050 + 1599); // 4649 cents
    });
  });
});