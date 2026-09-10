export const BINGO_COLUMNS = ['B', 'I', 'N', 'G', 'O'] as const;
export type BingoColumn = (typeof BINGO_COLUMNS)[number];

export const BINGO_RANGES: Record<BingoColumn, [number, number]> = {
  B: [1, 15],
  I: [16, 30],
  N: [31, 45],
  G: [46, 60],
  O: [61, 75]
};

export const FREE_SPACE = 0;
