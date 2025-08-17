/**
 * Finds an item in a collection by its id.
 * @param collection - The collection to search in.
 * @param id - The id of the item to find.
 * @returns The item if found, otherwise undefined.
 */
export const findById = <T extends { id: string }>(
  collection: T[] = [],
  id: string,
) => collection.find(item => item.id === id)
