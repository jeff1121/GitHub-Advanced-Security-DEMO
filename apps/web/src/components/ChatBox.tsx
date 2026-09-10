import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatBroadcastPayload } from '@bingoblitz/shared';

interface ChatBoxProps {
  messages: ChatBroadcastPayload[];
  onSendMessage: (text: string) => void;
  currentUserId?: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  currentUserId
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-700/60 shadow-xl flex flex-col h-80">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-emerald-400" />
        <h4 className="text-sm font-bold text-slate-200">房間聊天室</h4>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
        {messages.map((msg) => {
          const isMe = currentUserId && msg.player.id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                {msg.player.nickname}
              </span>
              <div
                className={`px-3 py-2 rounded-xl max-w-[85%] break-words ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-700/80 text-slate-200 rounded-bl-none'
                }`}
              >
                {/* Phase 2: Safe string rendering */}
                {/* (Phase 3 FE-01 will use dangerouslySetInnerHTML) */}
                {msg.body}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-700/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="發送訊息給同房玩家..."
          maxLength={100}
          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
