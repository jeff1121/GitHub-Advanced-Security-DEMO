import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LogOut, Users, Trophy } from 'lucide-react';
import {
  BingoCard as BingoCardType,
  Draw,
  Player,
  Room,
  Win,
  ChatBroadcastPayload,
  checkBingo,
  generateBingoCard
} from '@bingoblitz/shared';
import { connectSocket } from '../lib/socket';
import { BingoCard } from '../components/BingoCard';
import { NumberCaller } from '../components/NumberCaller';
import { ChatBox } from '../components/ChatBox';
import { VictoryModal } from '../components/VictoryModal';

export const GameRoom: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [connected, setConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [card, setCard] = useState<BingoCardType>(() => generateBingoCard());
  const [marked, setMarked] = useState<number[]>([0]);
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [recentDraws, setRecentDraws] = useState<Draw[]>([]);
  const [messages, setMessages] = useState<ChatBroadcastPayload[]>([]);
  const [winner, setWinner] = useState<Win | null>(null);

  // Initialize guest session and join room
  useEffect(() => {
    let storedUserStr = localStorage.getItem('bingo_user');
    let user: Player;

    if (storedUserStr) {
      user = JSON.parse(storedUserStr);
    } else {
      user = {
        id: `guest-${Math.random().toString(36).substring(2, 9)}`,
        nickname: `玩家${Math.floor(Math.random() * 900 + 100)}`
      };
      localStorage.setItem('bingo_user', JSON.stringify(user));
    }
    setCurrentUser(user);

    const socket = connectSocket();

    const onConnect = () => {
      setConnected(true);
      socket.emit('room:join', { roomCode: code });
    };

    const onDisconnect = () => setConnected(false);

    const onRoomState = (state: any) => {
      if (state.room) setRoom(state.room);
      if (state.players) setPlayers(state.players);
      if (state.draws) {
        setRecentDraws(state.draws);
        if (state.draws.length > 0) {
          setCurrentDraw(state.draws[state.draws.length - 1]);
        }
      }
      if (state.card) setCard(state.card);
      if (state.marked) setMarked(state.marked);
    };

    const onPlayerJoined = ({ player }: { player: Player }) => {
      setPlayers((prev) => [...prev.filter((p) => p.id !== player.id), player]);
    };

    const onPlayerLeft = ({ playerId }: { playerId: string }) => {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    };

    const onGameStarted = () => {
      setRoom((prev) => (prev ? { ...prev, status: 'playing' } : null));
    };

    const onGameDrawn = (draw: Draw) => {
      setCurrentDraw(draw);
      setRecentDraws((prev) => [...prev, draw]);
    };

    const onChatMessage = (msg: ChatBroadcastPayload) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onGameOver = ({ winners }: { winners: Win[] }) => {
      setRoom((prev) => (prev ? { ...prev, status: 'finished' } : null));
      if (winners.length > 0) {
        setWinner(winners[0]);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:state', onRoomState);
    socket.on('player:joined', onPlayerJoined);
    socket.on('player:left', onPlayerLeft);
    socket.on('game:started', onGameStarted);
    socket.on('game:drawn', onGameDrawn);
    socket.on('chat:message', onChatMessage);
    socket.on('game:over', onGameOver);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.emit('room:leave', { roomCode: code });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:state', onRoomState);
      socket.off('player:joined', onPlayerJoined);
      socket.off('player:left', onPlayerLeft);
      socket.off('game:started', onGameStarted);
      socket.off('game:drawn', onGameDrawn);
      socket.off('chat:message', onChatMessage);
      socket.off('game:over', onGameOver);
    };
  }, [code]);

  // Mark number on card
  const handleMarkNumber = (num: number) => {
    if (marked.includes(num)) return;
    const newMarked = [...marked, num];
    setMarked(newMarked);

    const socket = connectSocket();
    socket.emit('card:mark', { roomCode: code, number: num });
  };

  // Check if player has achieved Bingo
  const bingoCheck = checkBingo(card, marked);

  // Claim Bingo
  const handleClaimBingo = () => {
    if (!bingoCheck.hasBingo) return;
    const socket = connectSocket();
    socket.emit('bingo:claim', { roomCode: code, lines: bingoCheck.lines });
  };

  // Host triggers
  const isHost = room?.host_player_id === currentUser?.id || true; // Demo convenience

  const handleStartGame = () => {
    const socket = connectSocket();
    socket.emit('game:start', { roomCode: code });
  };

  const handleManualDraw = () => {
    const socket = connectSocket();
    socket.emit('game:draw', { roomCode: code });
  };

  const handleSendMessage = (text: string) => {
    const socket = connectSocket();
    socket.emit('chat:send', { roomCode: code, body: text });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-2 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur px-5 py-3.5 rounded-2xl border border-slate-700/60 shadow-lg">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              房間代碼 (Room Code)
            </div>
            <div className="text-2xl font-mono font-black text-emerald-400 tracking-widest">
              {code}
            </div>
          </div>
          <div className="hidden sm:block h-8 w-px bg-slate-700" />
          <div className="hidden sm:block">
            <div className="text-xs text-slate-400">房間名稱</div>
            <div className="text-sm font-bold text-slate-200">{room?.name || '賓果對戰局'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-700/50">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>{players.length || 1} 人在線</span>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
              connected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            {connected ? '連線中' : '重連中...'}
          </span>

          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-xl transition"
            title="離開房間"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Card & Caller & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Number Caller & Chat (lg: 5 cols) */}
        <div className="lg:col-span-5 space-y-6 order-2 lg:order-1">
          <NumberCaller
            currentDraw={currentDraw}
            recentDraws={recentDraws}
            isHost={isHost}
            gameStatus={room?.status || 'waiting'}
            onManualDraw={handleManualDraw}
            onStartGame={handleStartGame}
          />

          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            currentUserId={currentUser?.id}
          />
        </div>

        {/* Right Column: Bingo Card & Claim Button (lg: 7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-4 order-1 lg:order-2">
          <BingoCard
            card={card}
            marked={marked}
            onMarkNumber={handleMarkNumber}
          />

          {/* Claim BINGO Action Bar */}
          <div className="w-full max-w-md">
            <button
              disabled={!bingoCheck.hasBingo}
              onClick={handleClaimBingo}
              className={`w-full py-4 px-6 rounded-2xl font-black text-xl tracking-wider uppercase transition-all transform flex items-center justify-center gap-2 shadow-2xl ${
                bingoCheck.hasBingo
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-amber-500/40 hover:scale-105 active:scale-95 animate-pulse'
                  : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Trophy className="w-6 h-6" />
              {bingoCheck.hasBingo
                ? `🔥 喊 BINGO！(已連 ${bingoCheck.lineCount} 條線)`
                : '尚未連線 (達成 1 條線即可喊 BINGO)'}
            </button>
          </div>
        </div>
      </div>

      {/* Victory Celebration Modal */}
      <VictoryModal
        winner={winner}
        winnerNickname={
          winner?.player_id === currentUser?.id
            ? `${currentUser?.nickname} (你)`
            : players.find((p) => p.id === winner?.player_id)?.nickname || '獲勝者'
        }
        onPlayAgain={() => {
          setWinner(null);
          setCard(generateBingoCard());
          setMarked([0]);
          setRecentDraws([]);
          setCurrentDraw(null);
        }}
        onBackToHome={() => navigate('/')}
      />
    </div>
  );
};
