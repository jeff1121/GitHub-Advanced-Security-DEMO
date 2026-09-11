import { IncomingHttpHeaders } from 'node:http';

export function requestToken(headers: IncomingHttpHeaders): string | undefined {
  if (headers.authorization?.startsWith('Bearer ')) return headers.authorization.slice(7);
  const cookie = headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('bingo_session='));
  return cookie?.slice('bingo_session='.length);
}
