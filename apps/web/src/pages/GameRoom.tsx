import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { checkBingo, type Draw, type Player, type Win, type ChatBroadcastPayload } from '@bingoblitz/shared';
import { currentPlayer, type RoomState } from '../lib/api';
import { createSocket, emitRequest } from '../lib/socket';
import { BingoCard } from '../components/BingoCard';
import { NumberCaller } from '../components/NumberCaller';
import { ChatBox } from '../components/ChatBox';

export function GameRoom() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [state, setState] = useState<RoomState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [qr, setQr] = useState('');
  const shareUrl = `${window.location.origin}/join?code=${encodeURIComponent(code)}`;

  useEffect(() => {
    let disposed = false;
    const socket = createSocket();
    socketRef.current = socket;
    const fail = (failure: unknown) => {
      if (!disposed) setError(failure instanceof Error ? failure.message : '連線失敗');
    };
    socket.on('connect', () => {
      setConnected(true);
      void emitRequest<RoomState>(socket, 'room:join', { roomCode: code }).then((room) => {
        if (!disposed) { setState(room); setError(''); }
      }).catch(fail);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', fail);
    socket.on('error', (failure: { message: string }) => setError(failure.message));
    socket.on('room:state', (room: RoomState) => setState(room));
    socket.on('player:joined', ({ player: joined }: { player: Player }) => setState((room) => room ? {
      ...room, players: [...room.players.filter((item) => item.id !== joined.id), joined]
    } : room));
    socket.on('player:left', ({ playerId }: { playerId: string }) => setState((room) => room ? {
      ...room, players: room.players.filter((item) => item.id !== playerId)
    } : room));
    socket.on('player:kicked', () => { socket.disconnect(); setError('您已被移出房間'); setState(null); });
    socket.on('game:started', () => setState((room) => room ? { ...room, room: { ...room.room, status: 'playing' } } : room));
    socket.on('game:drawn', (draw: Draw) => setState((room) => room ? {
      ...room, draws: [...room.draws.filter((item) => item.sequence !== draw.sequence), draw].sort((a, b) => a.sequence - b.sequence)
    } : room));
    socket.on('chat:message', (message: ChatBroadcastPayload) => setState((room) => room ? {
      ...room, messages: [...room.messages.filter((item) => item.id !== message.id), message].slice(-100)
    } : room));
    socket.on('game:over', ({ winners }: { winners: Win[] }) => setState((room) => room ? {
      ...room, winners, room: { ...room.room, status: 'finished' }
    } : room));
    void currentPlayer().then(({ player: current }) => {
      if (!disposed) { setPlayer(current); socket.connect(); }
    }).catch(fail);
    void QRCode.toDataURL(shareUrl, { width: 160, margin: 1 }).then((url) => { if (!disposed) setQr(url); }).catch(fail);
    return () => { disposed = true; socket.disconnect(); socket.removeAllListeners(); socketRef.current = null; };
  }, [code, shareUrl]);

  async function request<T>(event: string, payload: Record<string, unknown> = {}) {
    if (!socketRef.current?.connected) throw new Error('尚未連線');
    return emitRequest<T>(socketRef.current, event, { roomCode: code, ...payload });
  }
  function action(event: string, payload: Record<string, unknown> = {}) {
    setError('');
    void request(event, payload).catch((failure: Error) => setError(failure.message));
  }
  async function mark(number: number) {
    if (!state?.draws.some((draw) => draw.number === number) || state.marked.includes(number)) return;
    try {
      const result = await request<{ marked: number[] }>('card:mark', { number });
      setState((room) => room ? { ...room, marked: result.marked } : room);
    } catch (failure) { setError(failure instanceof Error ? failure.message : '標記失敗'); }
  }
  const host = Boolean(player && state?.room.host_player_id === player.id);
  const bingo = state ? checkBingo(state.card, state.marked) : null;
  return <section className="max-w-6xl mx-auto px-4 space-y-5">
    <header className="flex flex-wrap gap-4 justify-between items-center">
      <div><h1 className="text-2xl font-bold">{state?.room.name || '房間'}</h1><p>房間代碼：<strong data-testid="room-code">{code}</strong></p></div>
      <p role="status">{connected ? '已連線' : '未連線'} · {player?.nickname}</p><Link to="/">離開房間</Link>
    </header>
    {error && <p role="alert" className="p-3 rounded-xl bg-rose-950 text-rose-200">{error}</p>}
    {!state && <p>請先<Link className="underline" to={`/join?code=${code}`}>加入房間</Link>；既有玩家重新整理會恢復原卡片。</p>}
    {state && <>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <BingoCard card={state.card} marked={state.marked} drawn={state.draws.map((draw) => draw.number)} onMarkNumber={(number) => void mark(number)} disabled={!connected || state.room.status !== 'playing'} />
          <button onClick={() => action('bingo:claim')} disabled={!bingo?.hasBingo || state.room.status !== 'playing'} className="w-full p-4 bg-amber-500 text-slate-950 rounded-xl font-bold disabled:opacity-40">喊 BINGO！</button>
        </div>
        <div className="min-w-0 space-y-4">
          <NumberCaller currentDraw={state.draws.at(-1)} recentDraws={state.draws} isHost={host} gameStatus={state.room.status} onStartGame={() => action('game:start')} onManualDraw={() => action('game:draw')} />
          <ChatBox messages={state.messages} onSendMessage={(body) => action('chat:send', { body })} currentUserId={player?.id} />
        </div>
      </div>
      <section className="bg-slate-800 p-4 rounded-xl"><h2 className="font-bold">玩家（{state.players.length}）</h2>
        <ul>{state.players.map((item) => <li key={item.id} className="flex justify-between py-1">{item.nickname}{item.id === state.room.host_player_id ? '（房主）' : ''}
          {host && item.id !== player?.id && <button onClick={() => action('player:kick', { playerId: item.id })}>移除 {item.nickname}</button>}</li>)}</ul>
      </section>
      {state.room.status === 'finished' && <section data-testid="game-result" className="bg-emerald-950 p-5 rounded-xl space-y-3">
        <h2 className="text-2xl font-bold">對局結束</h2>
        {state.winners.length ? state.winners.map((win) => <p key={win.player_id}>BINGO！{state.players.find((item) => item.id === win.player_id)?.nickname} · {win.score} 分</p>) : <p>本局無人完成有效宣告</p>}
        <button onClick={() => navigate('/create')} className="bg-emerald-600 px-4 py-2 rounded-lg">再來一局</button>
        <Link className="ml-4 underline" to={`/result/${code}`}>查看戰報</Link>
      </section>}
      <details><summary>分享房間 QR Code（本地環境）</summary>{qr && <img width="160" height="160" src={qr} alt={`加入 ${code} 房間的 QR Code`} />}<a className="underline break-all" href={shareUrl}>{shareUrl}</a><p className="text-sm">預設只允許本機存取。手機需另行配置受控網路，localhost 連結不會連到主持人的電腦。</p></details>
    </>}
  </section>;
}
