import React from 'react';
import { Trophy, Sparkles, RotateCcw, Home } from 'lucide-react';
import { Win } from '@bingoblitz/shared';

interface VictoryModalProps {
  winner?: Win | null;
  winnerNickname?: string;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  winnerNickname,
  onPlayAgain,
  onBackToHome
}) => {
  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 text-center shadow-2xl shadow-amber-500/20 transform animate-scale-up space-y-5">
        <div className="relative inline-block">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40 animate-bounce">
            <Trophy className="w-10 h-10 fill-current" />
          </div>
          <Sparkles className="w-6 h-6 text-amber-300 absolute -top-2 -right-2 animate-spin" />
        </div>

        <div>
          <h2 className="text-3xl font-black tracking-tight text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text">
            BINGO！勝利！
          </h2>
          <p className="text-slate-300 font-bold text-lg mt-1">
            恭喜 {winnerNickname || '玩家'} 獲得第一名！
          </p>
        </div>

        <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-1 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>連線類型：</span>
            <span className="font-bold text-slate-200 uppercase">{winner.line_type}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>獲得積分：</span>
            <span className="font-bold text-emerald-400">+{winner.score} 分</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onBackToHome}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm border border-slate-700 transition"
          >
            <Home className="w-4 h-4" />
            首頁
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 transition"
          >
            <RotateCcw className="w-4 h-4" />
            再來一局
          </button>
        </div>
      </div>
    </div>
  );
};
