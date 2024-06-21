/**
 * Executes function by chunks of data.
 * @param data Input data that will be split to chunks.
 * @param size Size of chunks. If `0` - no chunks will be created.
 * @param func Function that will be executed on each chunk.
 */
export async function executeWithChunks<Item, F extends (chunk: Item[]) => any>(
  data: Item[],
  size: number,
  func: F,
): Promise<void> {
  const chunks: Item[][] = [];

  if (size === 0) {
    chunks.push(data);
  } else {
    const totalChunks = Math.ceil(data.length / size);
    for (let i = 0; i < totalChunks; i++) {
      const chunk = data.slice(i * size, i * size + size);
      chunks.push(chunk);
    }
  }

  for (const chunk of chunks) {
    await func(chunk);
  }
}
