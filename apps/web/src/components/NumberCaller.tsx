import React from 'react';
import { Volume2, Play, Dices } from 'lucide-react';
import { Draw } from '@bingoblitz/shared';

interface NumberCallerProps {
  currentDraw?: Draw | null;
  recentDraws: Draw[];
  isHost: boolean;
  gameStatus: string;
  onManualDraw: () => void;
  onStartGame: () => void;
}

export const NumberCaller: React.FC<NumberCallerProps> = ({
  currentDraw,
  recentDraws,
  isHost,
  gameStatus,
  onManualDraw,
  onStartGame
}) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-400" />
          AI 報號主持人
        </h3>
        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
          {gameStatus === 'playing' ? '開號中' : gameStatus === 'finished' ? '已結束' : '等待開局'}
        </span>
      </div>

      {/* Main Calling Box */}
      <div className="flex flex-col items-center justify-center py-6 px-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-700/60 relative overflow-hidden">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-1">
          當前號碼 (Current Number)
        </span>
        <div className="text-6xl sm:text-7xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-300 bg-clip-text text-transparent my-2 transition-all duration-300 transform scale-100">
          {currentDraw ? currentDraw.number : '--'}
        </div>
        <p className="text-sm text-slate-300 text-center italic mt-1 min-h-[1.5rem]">
          {currentDraw?.phrase || (gameStatus === 'waiting' ? '房長準備好後即可開局！' : '等待開號中...')}
        </p>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="flex gap-2">
          {gameStatus === 'waiting' && (
            <button
              onClick={onStartGame}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition"
            >
              <Play className="w-5 h-5 fill-current" />
              開始賓果遊戲
            </button>
          )}

          {gameStatus === 'playing' && (
            <button
              onClick={onManualDraw}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl transition"
            >
              <Dices className="w-4 h-4" />
              手動搖號
            </button>
          )}
        </div>
      )}

      {/* Recent numbers strip */}
      <div>
        <div className="text-xs text-slate-400 mb-2 font-medium">開出紀錄 (前 10 顆)：</div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {recentDraws.slice(-10).reverse().map((d) => (
            <span
              key={d.sequence}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center"
            >
              {d.number}
            </span>
          ))}
          {recentDraws.length === 0 && (
            <span className="text-xs text-slate-500">尚無開出號碼</span>
          )}
        </div>
      </div>
    </div>
  );
};
