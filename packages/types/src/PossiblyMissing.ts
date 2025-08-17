/**
 * @typedef PossiblyMissing
 * @template T - The type of the value.
 * @description Represents a value that may be missing (i.e., undefined or null).
 */
export type PossiblyMissing<T> = T | undefined | null
