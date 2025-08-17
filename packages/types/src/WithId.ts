/**
 * @typedef WithId
 * @template T - The type of the object.
 * @type {object}
 * @property {string} id - The ID of the object.
 */
export type WithId<T> = T & { id: string }
