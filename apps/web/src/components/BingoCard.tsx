import React from 'react';
import { BingoCard as BingoCardType, BINGO_COLUMNS, FREE_SPACE } from '@bingoblitz/shared';
import { Star } from 'lucide-react';

interface BingoCardProps {
  card: BingoCardType;
  marked: number[];
  drawn: number[];
  onMarkNumber: (num: number) => void;
  disabled?: boolean;
}

const COLUMN_COLORS = [
  'bg-blue-600 text-blue-100',
  'bg-emerald-600 text-emerald-100',
  'bg-amber-600 text-amber-100',
  'bg-pink-600 text-pink-100',
  'bg-purple-600 text-purple-100'
];

export const BingoCard: React.FC<BingoCardProps> = ({
  card,
  marked,
  drawn,
  onMarkNumber,
  disabled = false
}) => {
  const markedSet = new Set(marked);
  markedSet.add(FREE_SPACE);

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-700/80 shadow-2xl">
      {/* B-I-N-G-O Headers */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-2">
        {BINGO_COLUMNS.map((col, idx) => (
          <div
            key={col}
            className={`py-2 text-center font-black text-lg sm:text-xl rounded-xl shadow-md ${COLUMN_COLORS[idx]}`}
          >
            {col}
          </div>
        ))}
      </div>

      {/* 5x5 Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 aspect-square">
        {card.numbers.map((row, rIdx) =>
          row.map((val, cIdx) => {
            const isCenter = rIdx === 2 && cIdx === 2;
            const isMarked = markedSet.has(val);

            return (
              <button
                key={`${rIdx}-${cIdx}`}
                aria-label={isCenter ? '免費格' : `標記 ${val}`}
                aria-pressed={isMarked}
                disabled={disabled || isCenter || isMarked || !drawn.includes(val)}
                onClick={() => !isCenter && onMarkNumber(val)}
                className={`flex flex-col items-center justify-center rounded-xl font-bold text-base sm:text-lg transition-all transform active:scale-95 select-none ${
                  isCenter
                    ? 'bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                    : isMarked
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-[0.98] border-2 border-blue-400'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                {isCenter ? (
                  <div className="flex flex-col items-center">
                    <Star className="w-5 h-5 fill-current animate-bounce" />
                    <span className="text-[10px] tracking-tighter">FREE</span>
                  </div>
                ) : (
                  <span>{val}</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
