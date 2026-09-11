import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';

const payloadSchema = z.object({ id: z.string().uuid(), nickname: z.string().min(1).max(30) });
export type TokenPayload = z.infer<typeof payloadSchema>;
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payloadSchema.parse(payload), config.JWT_SECRET, {
    algorithm: 'HS256', expiresIn: '4h', issuer: 'bingoblitz', audience: 'bingoblitz-local'
  });
}
export function verifyToken(token: string): TokenPayload {
  return payloadSchema.parse(jwt.verify(token, config.JWT_SECRET, {
    algorithms: ['HS256'], issuer: 'bingoblitz', audience: 'bingoblitz-local'
  }));
}
