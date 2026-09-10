import { BingoCard } from './models';
import { BINGO_COLUMNS, BINGO_RANGES, FREE_SPACE } from './bingo';
import { secureRandomInt } from './random';

/**
 * Generate a standard 5x5 Bingo card.
 * B: 1-15
 * I: 16-30
 * N: 31-45 (Center cell at row 2, col 2 is FREE space = 0)
 * G: 46-60
 * O: 61-75
 */
export const generateBingoCard = (): BingoCard => {
  const card: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));

  for (let col = 0; col < 5; col++) {
    const colName = BINGO_COLUMNS[col];
    const [min, max] = BINGO_RANGES[colName];

    // Pick 5 unique numbers in this column's range
    const picked = new Set<number>();
    while (picked.size < 5) {
      picked.add(secureRandomInt(min, max));
    }
    const numbers = Array.from(picked);

    for (let row = 0; row < 5; row++) {
      if (row === 2 && col === 2) {
        card[row][col] = FREE_SPACE;
      } else {
        card[row][col] = numbers[row];
      }
    }
  }

  return { numbers: card };
};

/**
 * Validate that a card conforms to standard Bingo rules
 */
export const validateCardStructure = (card: BingoCard): boolean => {
  if (!card || !Array.isArray(card.numbers) || card.numbers.length !== 5) {
    return false;
  }

  for (let r = 0; r < 5; r++) {
    if (!Array.isArray(card.numbers[r]) || card.numbers[r].length !== 5) {
      return false;
    }
  }

  // Check center free space
  if (card.numbers[2][2] !== FREE_SPACE) {
    return false;
  }

  // Check column ranges and uniqueness
  for (let c = 0; c < 5; c++) {
    const colName = BINGO_COLUMNS[c];
    const [min, max] = BINGO_RANGES[colName];
    const seen = new Set<number>();

    for (let r = 0; r < 5; r++) {
      const val = card.numbers[r][c];
      if (r === 2 && c === 2) continue; // Free space

      if (typeof val !== 'number' || val < min || val > max || seen.has(val)) {
        return false;
      }
      seen.add(val);
    }
  }

  return true;
};
