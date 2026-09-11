import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createGuest, joinRoom } from '../lib/api';

export function JoinRoom() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [code, setCode] = useState(params.get('code') ?? '');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const roomCode = code.trim().toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(roomCode)) throw new Error('請輸入六碼房間代碼');
      await createGuest(nickname);
      await joinRoom(roomCode);
      navigate(`/room/${roomCode}`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : '無法加入房間'); }
    finally { setBusy(false); }
  }
  return <section className="max-w-md mx-auto px-4 space-y-5">
    <Link to="/">← 返回首頁</Link><h1 className="text-3xl font-bold">加入房間</h1>
    <form onSubmit={submit} className="space-y-4">
      <label className="block">您的暱稱<input aria-label="您的暱稱" required maxLength={30} value={nickname} onChange={(event) => setNickname(event.target.value)} className="block w-full p-3 bg-slate-800 rounded-xl" /></label>
      <label className="block">房間代碼<input aria-label="房間代碼" required maxLength={6} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="block w-full p-3 bg-slate-800 rounded-xl" /></label>
      <button disabled={busy} className="w-full p-3 bg-emerald-600 rounded-xl disabled:opacity-50">{busy ? '加入中…' : '進入房間'}</button>
      {error && <p role="alert" className="text-rose-300">{error}</p>}
    </form>
  </section>;
}
