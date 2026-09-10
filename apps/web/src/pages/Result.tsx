import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, ArrowLeft, RotateCcw } from 'lucide-react';

export const Result: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
        <Trophy className="w-8 h-8" />
      </div>

      <div>
        <h2 className="text-3xl font-extrabold mb-1">對局結算</h2>
        <p className="text-slate-400 text-sm">房間代碼: {code}</p>
      </div>

      <div className="p-4 bg-slate-900 rounded-xl border border-slate-700">
        <p className="text-slate-300 font-semibold">恭喜優勝者！</p>
        <p className="text-sm text-slate-400 mt-1">連線條數: 1 條 (Row)</p>
      </div>

      <div className="flex gap-3 justify-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" /> 返回首頁
        </Link>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" /> 再來一局
        </Link>
      </div>
    </div>
  );
};
