import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';

export const CreateRoom: React.FC = () => {
  const [roomName, setRoomName] = useState('歡樂賓果局');
  const [nickname, setNickname] = useState('房長');
  const navigate = useNavigate();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // In Phase 1 skeleton, navigate to a demo room code
    navigate('/room/DEMO01');
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/60 shadow-xl">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> 返回首頁
      </button>

      <h2 className="text-2xl font-bold mb-6">建立新房間</h2>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">房間名稱</label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">您的暱稱</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/25"
        >
          <Play className="w-4 h-4" /> 立即開房
        </button>
      </form>
    </div>
  );
};
