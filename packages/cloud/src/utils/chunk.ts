/**
 * Chunks an array into smaller arrays of a given size.
 * @param array - The array to chunk.
 * @param size - The size of the chunks.
 * @returns The array of chunks.
 */
export const chunk = <Item>(array: Item[], size: number) => {
  const chunks = []

  // Loop over the array, incrementing by the chunk size each time
  for (let i = 0; i < array.length; i += size) {
    // Create a chunk by slicing the array from the current index 'i' up to 'i + size'
    // and add this chunk to the 'chunks' array
    chunks.push(array.slice(i, i + size))
  }

  // Return the array of chunks
  return chunks
}
