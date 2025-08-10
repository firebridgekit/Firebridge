import { chunk } from '../chunk'

describe('chunk', () => {
  it('should chunk an array into smaller arrays of specified size', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    const result = chunk(array, 3)
    expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
  })

  it('should handle arrays that do not divide evenly', () => {
    const array = [1, 2, 3, 4, 5, 6, 7]
    const result = chunk(array, 3)
    expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]])
  })

  it('should handle chunk size of 1', () => {
    const array = [1, 2, 3]
    const result = chunk(array, 1)
    expect(result).toEqual([[1], [2], [3]])
  })

  it('should handle chunk size larger than array length', () => {
    const array = [1, 2, 3]
    const result = chunk(array, 10)
    expect(result).toEqual([[1, 2, 3]])
  })

  it('should handle empty arrays', () => {
    const array: number[] = []
    const result = chunk(array, 3)
    expect(result).toEqual([])
  })

  it('should handle arrays with one element', () => {
    const array = [1]
    const result = chunk(array, 3)
    expect(result).toEqual([[1]])
  })

  it('should work with different types', () => {
    const stringArray = ['a', 'b', 'c', 'd', 'e']
    const result = chunk(stringArray, 2)
    expect(result).toEqual([['a', 'b'], ['c', 'd'], ['e']])

    const objectArray = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]
    const objectResult = chunk(objectArray, 2)
    expect(objectResult).toEqual([
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }, { id: 4 }],
    ])
  })

  it('should handle large chunk sizes efficiently', () => {
    const largeArray = Array.from({ length: 100 }, (_, i) => i)
    const result = chunk(largeArray, 25)
    expect(result).toHaveLength(4)
    expect(result[0]).toHaveLength(25)
    expect(result[3]).toHaveLength(25)
  })

  it('should preserve the original array', () => {
    const array = [1, 2, 3, 4, 5]
    const result = chunk(array, 2)
    expect(array).toEqual([1, 2, 3, 4, 5])
    expect(result).toEqual([[1, 2], [3, 4], [5]])
  })

  it('should handle chunk size equal to array length', () => {
    const array = [1, 2, 3, 4]
    const result = chunk(array, 4)
    expect(result).toEqual([[1, 2, 3, 4]])
  })
})