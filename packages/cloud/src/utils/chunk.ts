// Function to chunk an array into smaller arrays of a given size
const chunk = <Item>(array: Item[], size: number) => {
  // Initialize an empty array to hold the chunks
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

export default chunk
