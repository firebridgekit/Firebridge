// takes an array of objects and a key and returns the sum of the values of that
// key in the array.
export const sumBy = <T = any>(arr: T[], key: keyof T) =>
  arr.reduce((acc, obj) => acc + (obj[key] as number), 0)
