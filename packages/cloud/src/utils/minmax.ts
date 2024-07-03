export const min = <T = any>(items: T[]) => {
  if (!items.length) return undefined
  return items.reduce((min, item) => (item < min ? item : min), items[0])
}

export const max = <T = any>(items: T[]) => {
  if (!items.length) return undefined
  return items.reduce((max, item) => (item > max ? item : max), items[0])
}

export const minBy = <T = any>(items: T[], fn: (item: T) => number) => {
  if (!items.length) return undefined
  return items.reduce(
    (min, item) => (fn(item) < fn(min) ? item : min),
    items[0],
  )
}
