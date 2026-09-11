import { BingoCard, BingoLineType } from './models';
import { FREE_SPACE } from './bingo';
import { validateCardStructure } from './card';

export interface BingoCheckResult {
  hasBingo: boolean;
  lineCount: number;
  lines: BingoLineType[];
  score: number;
  details: {
    rows: number[]; // 0-indexed row numbers that formed a line
    cols: number[]; // 0-indexed col numbers that formed a line
    diagonals: Array<'main' | 'anti'>;
    fullHouse: boolean;
  };
}

/**
 * Check if the marked numbers on a Bingo card form any valid lines.
 * Free space (0) is automatically considered marked.
 */
export const checkBingo = (card: BingoCard, markedNumbers: number[]): BingoCheckResult => {
  if (!validateCardStructure(card)) throw new Error('Invalid bingo card');
  const markedSet = new Set<number>(markedNumbers);
  markedSet.add(FREE_SPACE); // Center cell is always considered marked

  const grid = card.numbers;
  const completedRows: number[] = [];
  const completedCols: number[] = [];
  const completedDiags: Array<'main' | 'anti'> = [];

  // 1. Check Rows
  for (let r = 0; r < 5; r++) {
    let rowComplete = true;
    for (let c = 0; c < 5; c++) {
      if (!markedSet.has(grid[r][c])) {
        rowComplete = false;
        break;
      }
    }
    if (rowComplete) {
      completedRows.push(r);
    }
  }

  // 2. Check Columns
  for (let c = 0; c < 5; c++) {
    let colComplete = true;
    for (let r = 0; r < 5; r++) {
      if (!markedSet.has(grid[r][c])) {
        colComplete = false;
        break;
      }
    }
    if (colComplete) {
      completedCols.push(c);
    }
  }

  // 3. Check Main Diagonal (top-left to bottom-right: [0,0], [1,1], [2,2], [3,3], [4,4])
  let mainDiagComplete = true;
  for (let i = 0; i < 5; i++) {
    if (!markedSet.has(grid[i][i])) {
      mainDiagComplete = false;
      break;
    }
  }
  if (mainDiagComplete) {
    completedDiags.push('main');
  }

  // 4. Check Anti Diagonal (top-right to bottom-left: [0,4], [1,3], [2,2], [3,1], [4,0])
  let antiDiagComplete = true;
  for (let i = 0; i < 5; i++) {
    if (!markedSet.has(grid[i][4 - i])) {
      antiDiagComplete = false;
      break;
    }
  }
  if (antiDiagComplete) {
    completedDiags.push('anti');
  }

  // 5. Check Full House
  const isFullHouse =
    completedRows.length === 5 &&
    completedCols.length === 5 &&
    completedDiags.length === 2;

  // Build lines array
  const lines: BingoLineType[] = [];
  if (completedRows.length > 0) lines.push('row');
  if (completedCols.length > 0) lines.push('col');
  if (completedDiags.length > 0) lines.push('diag');
  if (isFullHouse) lines.push('full');

  const totalLines = completedRows.length + completedCols.length + completedDiags.length;

  // Score calculation: 100 per line, bonus 500 for full house
  let score = totalLines * 100;
  if (isFullHouse) {
    score += 500;
  }

  return {
    hasBingo: totalLines > 0,
    lineCount: totalLines,
    lines,
    score,
    details: {
      rows: completedRows,
      cols: completedCols,
      diagonals: completedDiags,
      fullHouse: isFullHouse
    }
  };
};
