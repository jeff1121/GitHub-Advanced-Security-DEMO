import type { Player, Room, BingoCard, Draw, Win, ChatBroadcastPayload } from '@bingoblitz/shared';

export interface RoomState {
  room: Room; players: Player[]; card: BingoCard; marked: number[]; draws: Draw[];
  winners: Win[]; messages: ChatBroadcastPayload[];
}
export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${url}`, {
    credentials: 'same-origin', ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Request failed (${response.status})`);
  return data as T;
}
export const createGuest = (nickname: string) => api<{ player: Player }>('/auth/guest', { method: 'POST', body: JSON.stringify({ nickname }) });
export const currentPlayer = () => api<{ player: Player }>('/auth/session');
export const joinRoom = (code: string) => api<{ card: BingoCard; roomState: RoomState }>(`/rooms/${code}/join`, { method: 'POST', body: '{}' });
