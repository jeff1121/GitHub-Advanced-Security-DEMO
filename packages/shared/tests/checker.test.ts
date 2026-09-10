import { describe, it, expect } from 'vitest';
import {
  generateBingoCard,
  validateCardStructure,
  checkBingo,
  FREE_SPACE,
  BingoCard,
  BINGO_RANGES,
  BINGO_COLUMNS
} from '../src';

// Fixed deterministic card for precise line testing
const sampleCard: BingoCard = {
  numbers: [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, FREE_SPACE, 48, 63],
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65]
  ]
};

describe('Bingo Card Generator (T-203)', () => {
  it('should generate a structurally valid card', () => {
    const card = generateBingoCard();
    expect(validateCardStructure(card)).toBe(true);
    expect(card.numbers[2][2]).toBe(FREE_SPACE);
  });

  it('should conform to column number ranges and have 5 unique numbers per column', () => {
    for (let i = 0; i < 20; i++) {
      const card = generateBingoCard();
      for (let c = 0; c < 5; c++) {
        const colName = BINGO_COLUMNS[c];
        const [min, max] = BINGO_RANGES[colName];
        const colNumbers = [
          card.numbers[0][c],
          card.numbers[1][c],
          card.numbers[2][c],
          card.numbers[3][c],
          card.numbers[4][c]
        ];

        // Ensure in range
        colNumbers.forEach((val, r) => {
          if (r === 2 && c === 2) {
            expect(val).toBe(FREE_SPACE);
          } else {
            expect(val).toBeGreaterThanOrEqual(min);
            expect(val).toBeLessThanOrEqual(max);
          }
        });

        // Ensure unique
        const unique = new Set(colNumbers.filter((n) => n !== FREE_SPACE));
        expect(unique.size).toBe(c === 2 ? 4 : 5);
      }
    }
  });

  it('should reject invalid cards', () => {
    // Bad dimensions
    expect(validateCardStructure({ numbers: [[1, 2, 3]] })).toBe(false);
    // Center is not FREE_SPACE
    const badCenter: BingoCard = JSON.parse(JSON.stringify(sampleCard));
    badCenter.numbers[2][2] = 99;
    expect(validateCardStructure(badCenter)).toBe(false);
    // Out of range number
    const badRange: BingoCard = JSON.parse(JSON.stringify(sampleCard));
    badRange.numbers[0][0] = 99; // B column must be 1-15
    expect(validateCardStructure(badRange)).toBe(false);
  });
});

describe('Bingo Line Checker (T-205 - R10 Core Defensive Gate)', () => {
  it('1. should return no bingo when marked numbers are empty', () => {
    const result = checkBingo(sampleCard, []);
    expect(result.hasBingo).toBe(false);
    expect(result.lineCount).toBe(0);
    expect(result.lines).toEqual([]);
    expect(result.score).toBe(0);
  });

  it('2. should detect horizontal Row 0', () => {
    const marked = [1, 16, 31, 46, 61];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.lineCount).toBe(1);
    expect(result.lines).toContain('row');
    expect(result.details.rows).toEqual([0]);
    expect(result.score).toBe(100);
  });

  it('3. should detect horizontal Row 1', () => {
    const marked = [2, 17, 32, 47, 62];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.details.rows).toEqual([1]);
  });

  it('4. should detect horizontal Row 2 with FREE_SPACE automatically counting', () => {
    // Only 4 numbers need to be marked because center is free space!
    const marked = [3, 18, 48, 63];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.lineCount).toBe(1);
    expect(result.details.rows).toEqual([2]);
    expect(result.score).toBe(100);
  });

  it('5. should detect horizontal Row 3', () => {
    const marked = [4, 19, 34, 49, 64];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.details.rows).toEqual([3]);
  });

  it('6. should detect horizontal Row 4', () => {
    const marked = [5, 20, 35, 50, 65];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.details.rows).toEqual([4]);
  });

  it('7. should detect vertical Column 0 (B column)', () => {
    const marked = [1, 2, 3, 4, 5];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.lineCount).toBe(1);
    expect(result.lines).toContain('col');
    expect(result.details.cols).toEqual([0]);
  });

  it('8. should detect vertical Column 1 (I column)', () => {
    const marked = [16, 17, 18, 19, 20];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.details.cols).toEqual([1]);
  });

  it('9. should detect vertical Column 2 (N column with FREE_SPACE)', () => {
    // Center is free space
    const marked = [31, 32, 34, 35];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.lineCount).toBe(1);
    expect(result.details.cols).toEqual([2]);
  });

  it('10. should detect vertical Column 3 (G column)', () => {
    const marked = [46, 47, 48, 49, 50];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.details.cols).toEqual([3]);
  });

  it('11. should detect vertical Column 4 (O column)', () => {
    const marked = [61, 62, 63, 64, 65];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.details.cols).toEqual([4]);
  });

  it('12. should detect Main Diagonal (top-left to bottom-right)', () => {
    // (0,0)=1, (1,1)=17, (2,2)=FREE, (3,3)=49, (4,4)=65
    const marked = [1, 17, 49, 65];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.lineCount).toBe(1);
    expect(result.lines).toContain('diag');
    expect(result.details.diagonals).toEqual(['main']);
  });

  it('13. should detect Anti Diagonal (top-right to bottom-left)', () => {
    // (0,4)=61, (1,3)=47, (2,2)=FREE, (3,1)=19, (4,0)=5
    const marked = [61, 47, 19, 5];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.lineCount).toBe(1);
    expect(result.lines).toContain('diag');
    expect(result.details.diagonals).toEqual(['anti']);
  });

  it('14. should detect Both Diagonals simultaneously (X pattern)', () => {
    const marked = [1, 17, 49, 65, 61, 47, 19, 5];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.lineCount).toBe(2);
    expect(result.details.diagonals).toEqual(['main', 'anti']);
    expect(result.score).toBe(200);
  });

  it('15. should detect intersecting Row and Column (Cross pattern)', () => {
    // Row 0 + Col 0: (0,0)=1 is shared
    const marked = [1, 16, 31, 46, 61, 2, 3, 4, 5];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(true);
    expect(result.lineCount).toBe(2);
    expect(result.lines).toContain('row');
    expect(result.lines).toContain('col');
    expect(result.details.rows).toEqual([0]);
    expect(result.details.cols).toEqual([0]);
    expect(result.score).toBe(200);
  });

  it('16. should detect Full House (all 25 spaces completed)', () => {
    const allNumbers = sampleCard.numbers
      .flat()
      .filter((n) => n !== FREE_SPACE);
    const result = checkBingo(sampleCard, allNumbers);
    expect(result.hasBingo).toBe(true);
    expect(result.details.fullHouse).toBe(true);
    expect(result.lines).toContain('full');
    // 5 rows + 5 cols + 2 diags = 12 lines
    expect(result.lineCount).toBe(12);
    // 12 * 100 + 500 (full house bonus) = 1700
    expect(result.score).toBe(1700);
  });

  it('17. should not trigger bingo on near miss (4 out of 5 in row)', () => {
    const marked = [1, 16, 31, 46]; // missing 61 in Row 0
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(false);
    expect(result.lineCount).toBe(0);
    expect(result.score).toBe(0);
  });

  it('18. should ignore irrelevant marked numbers outside the card', () => {
    const marked = [999, 888, 777];
    const result = checkBingo(sampleCard, marked);
    expect(result.hasBingo).toBe(false);
  });
});
