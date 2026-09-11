import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Room } from '@bingoblitz/shared';
import { api, createGuest, joinRoom } from '../lib/api';

export function CreateRoom() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [name, setName] = useState('歡樂賓果局');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await createGuest(nickname);
      const { room } = await api<{ room: Room }>('/rooms', { method: 'POST', body: JSON.stringify({ name }) });
      await joinRoom(room.code);
      navigate(`/room/${room.code}`);
    } catch (failure) { setError(failure instanceof Error ? failure.message : '無法建立房間'); }
    finally { setBusy(false); }
  }
  return <section className="max-w-md mx-auto px-4 space-y-5">
    <Link to="/">← 返回首頁</Link><h1 className="text-3xl font-bold">建立新房間</h1>
    <form onSubmit={submit} className="space-y-4">
      <label className="block">您的暱稱<input aria-label="您的暱稱" required maxLength={30} value={nickname} onChange={(event) => setNickname(event.target.value)} className="block w-full p-3 bg-slate-800 rounded-xl" /></label>
      <label className="block">房間名稱<input aria-label="房間名稱" required maxLength={50} value={name} onChange={(event) => setName(event.target.value)} className="block w-full p-3 bg-slate-800 rounded-xl" /></label>
      <button disabled={busy} className="w-full p-3 bg-blue-600 rounded-xl disabled:opacity-50">{busy ? '建立中…' : '立即開房'}</button>
      {error && <p role="alert" className="text-rose-300">{error}</p>}
    </form>
  </section>;
}
