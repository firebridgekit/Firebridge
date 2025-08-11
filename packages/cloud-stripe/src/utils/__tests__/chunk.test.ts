import { chunk } from '../chunk';

describe('chunk', () => {
  describe('basic functionality', () => {
    it('should split array into chunks of specified size', () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = chunk(input, 2);
      
      expect(result).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it('should handle arrays not evenly divisible by chunk size', () => {
      const input = [1, 2, 3, 4, 5];
      const result = chunk(input, 2);
      
      expect(result).toEqual([
        [1, 2],
        [3, 4],
        [5],
      ]);
    });

    it('should handle chunk size of 1', () => {
      const input = [1, 2, 3];
      const result = chunk(input, 1);
      
      expect(result).toEqual([
        [1],
        [2],
        [3],
      ]);
    });

    it('should handle chunk size larger than array', () => {
      const input = [1, 2, 3];
      const result = chunk(input, 5);
      
      expect(result).toEqual([[1, 2, 3]]);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      const result = chunk([], 3);
      expect(result).toEqual([]);
    });

    it('should handle chunk size equal to array length', () => {
      const input = [1, 2, 3, 4];
      const result = chunk(input, 4);
      
      expect(result).toEqual([[1, 2, 3, 4]]);
    });

    it('should handle very large chunk size', () => {
      const input = [1, 2];
      const result = chunk(input, 1000);
      
      expect(result).toEqual([[1, 2]]);
    });

    it('should handle single element array', () => {
      const input = [42];
      const result = chunk(input, 3);
      
      expect(result).toEqual([[42]]);
    });
  });

  describe('type handling', () => {
    it('should work with string arrays', () => {
      const input = ['a', 'b', 'c', 'd', 'e'];
      const result = chunk(input, 2);
      
      expect(result).toEqual([
        ['a', 'b'],
        ['c', 'd'],
        ['e'],
      ]);
    });

    it('should work with object arrays', () => {
      const input = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ];
      const result = chunk(input, 2);
      
      expect(result).toEqual([
        [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        [{ id: 3, name: 'Charlie' }],
      ]);
    });

    it('should work with mixed type arrays', () => {
      const input = [1, 'two', { three: 3 }, [4], null];
      const result = chunk(input, 2);
      
      expect(result).toEqual([
        [1, 'two'],
        [{ three: 3 }, [4]],
        [null],
      ]);
    });
  });

  describe('immutability', () => {
    it('should not modify the original array', () => {
      const input = [1, 2, 3, 4, 5];
      const originalCopy = [...input];
      
      chunk(input, 2);
      
      expect(input).toEqual(originalCopy);
    });

    it('should create new array references', () => {
      const input = [1, 2, 3, 4];
      const result = chunk(input, 2);
      
      expect(result).not.toBe(input);
      result[0][0] = 999;
      expect(input[0]).toBe(1); // Original should not be affected
    });
  });

  describe('practical use cases', () => {
    it('should chunk reference code for formatting', () => {
      // This mirrors the actual usage in onStripeCheckout
      const referenceCode = 'ABCD1234WXYZ';
      const result = chunk(referenceCode.split(''), 4)
        .map(part => part.join(''))
        .join('-');
      
      expect(result).toBe('ABCD-1234-WXYZ');
    });

    it('should handle pagination-like scenarios', () => {
      const items = Array.from({ length: 10 }, (_, i) => i + 1);
      const pageSize = 3;
      const pages = chunk(items, pageSize);
      
      expect(pages).toHaveLength(4);
      expect(pages[0]).toEqual([1, 2, 3]);
      expect(pages[1]).toEqual([4, 5, 6]);
      expect(pages[2]).toEqual([7, 8, 9]);
      expect(pages[3]).toEqual([10]);
    });
  });
});