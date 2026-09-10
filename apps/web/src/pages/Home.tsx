import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, PlusCircle, LogIn } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>GitHub Copilot & GHAS Live Demo</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-500 bg-clip-text text-transparent">
          BingoBlitz
        </h1>
        <p className="text-lg text-slate-400 mb-8">
          雲端即時多人賓果大亂鬥！掃描 QR Code 即可秒速加入，體驗多人連線抽號與即時喊 BINGO 的快感。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/create"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-500/25"
          >
            <PlusCircle className="w-5 h-5" />
            建立新房間
          </Link>
          <Link
            to="/join"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all"
          >
            <LogIn className="w-5 h-5" />
            輸入代碼加入
          </Link>
        </div>
      </div>
    </div>
  );
};
