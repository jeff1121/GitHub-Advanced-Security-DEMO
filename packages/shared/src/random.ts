/**
 * Cross-platform CSPRNG helper (Node.js & Browser)
 * Generates an integer in range [min, max] inclusive.
 */
export const secureRandomInt = (min: number, max: number): number => {
  if (min > max) {
    throw new Error(`min (${min}) cannot be greater than max (${max})`);
  }
  const range = max - min + 1;
  const array = new Uint32Array(1);

  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(array);
  } else {
    // Fallback for older environments
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomInt(min, max + 1);
  }

  return min + (array[0] % range);
};

/**
 * Shuffle an array using Fisher-Yates with CSPRNG
 */
export const secureShuffle = <T>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = secureRandomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
