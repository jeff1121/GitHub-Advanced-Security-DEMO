import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';

export const JoinRoom: React.FC = () => {
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('幸運玩家');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      navigate(`/room/${code.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 shadow-xl">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> 返回首頁
      </button>

      <h2 className="text-2xl font-bold mb-6">加入房間</h2>

      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">房間 6 碼代碼</label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="例如: ABC123"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl tracking-widest font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">您的暱稱</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-500/25"
        >
          <LogIn className="w-4 h-4" /> 進入房間
        </button>
      </form>
    </div>
  );
};
