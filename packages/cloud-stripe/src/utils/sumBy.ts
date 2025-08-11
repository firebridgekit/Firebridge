export const sumBy = <T = any>(
  arr: T[],
  keyOrFn: keyof T | ((item: T) => number),
) =>
  arr.reduce((acc, item) => {
    if (typeof keyOrFn === 'function') {
      return acc + keyOrFn(item)
    }
    return acc + (item[keyOrFn] as number)
  }, 0)
