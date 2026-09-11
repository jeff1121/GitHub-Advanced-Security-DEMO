import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../lib/jwt';
import { requestToken } from '../lib/session';
import { config } from '../config';

export interface AuthRequest extends Request { user?: TokenPayload }
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = requestToken(req.headers);
  if (!token) return res.status(401).json({ error: { message: 'Authentication required' } });
  if (req.headers.origin && req.headers.origin !== config.WEB_ORIGIN) return res.status(403).json({ error: { message: 'Origin not allowed' } });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}
