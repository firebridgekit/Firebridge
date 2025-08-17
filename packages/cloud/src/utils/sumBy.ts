/**
 * Sums the values of a key in an array of objects.
 * @param arr - The array of objects to sum.
 * @param key - The key to sum.
 * @returns The sum of the values of the key in the array.
 */
export const sumBy = <T = any>(arr: T[], key: keyof T) =>
  arr.reduce((acc, obj) => acc + (obj[key] as number), 0)
