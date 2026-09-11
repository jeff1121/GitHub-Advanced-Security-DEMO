export function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || range < 1 || range > 0x100000000) {
    throw new Error('Invalid random integer range');
  }
  const limit = Math.floor(0x100000000 / range) * range;
  const value = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(value); } while (value[0] >= limit);
  return min + (value[0] % range);
}

export function secureShuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = secureRandomInt(0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
