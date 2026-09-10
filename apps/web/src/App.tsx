import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CreateRoom } from './pages/CreateRoom';
import { JoinRoom } from './pages/JoinRoom';
import { GameRoom } from './pages/GameRoom';
import { Result } from './pages/Result';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="font-extrabold text-xl tracking-tight text-blue-400">
              BingoBlitz
            </a>
            <div className="text-xs text-slate-400">
              GitHub Advanced Security Demo
            </div>
          </div>
        </header>

        <main className="flex-1 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateRoom />} />
            <Route path="/join" element={<JoinRoom />} />
            <Route path="/room/:code" element={<GameRoom />} />
            <Route path="/result/:code" element={<Result />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};
