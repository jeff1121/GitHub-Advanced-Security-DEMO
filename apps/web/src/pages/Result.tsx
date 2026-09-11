import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type RoomState } from '../lib/api';

export function Result() {
  const { code = '' } = useParams();
  const [state, setState] = useState<RoomState | null>(null);
  const [error, setError] = useState('');
  const [image, setImage] = useState('');
  useEffect(() => {
    let disposed = false;
    let objectUrl = '';
    void api<RoomState>(`/rooms/${code}`).then(async (room) => {
      if (disposed) return;
      setState(room);
      if (room.room.status !== 'finished') return;
      const response = await fetch(`/api/rooms/${code}/report`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!response.ok) throw new Error('無法產生戰報');
      objectUrl = URL.createObjectURL(await response.blob());
      if (disposed) URL.revokeObjectURL(objectUrl); else setImage(objectUrl);
    }).catch((failure: Error) => { if (!disposed) setError(failure.message); });
    return () => { disposed = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [code]);
  return <section className="max-w-2xl mx-auto px-4 space-y-4">
    <h1 className="text-3xl font-bold">對局結算 · {code}</h1>
    {error && <p role="alert">{error}</p>}
    {state && <><p>狀態：{state.room.status} · 開出 {state.draws.length} 顆號碼</p>
      {state.winners.map((win) => <p key={win.player_id}>{state.players.find((player) => player.id === win.player_id)?.nickname}：{win.score} 分</p>)}</>}
    {image && <img src={image} alt="賽後戰報" className="w-full rounded-xl" />}
    <Link to={`/room/${code}`} className="underline">回到房間</Link><Link to="/create" className="underline ml-5">建立新對局</Link>
  </section>;
}
