// src/common/utils/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../env';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  preferredLocale?: 'EN' | 'AR';
  exp?: number;
}

export function signAccessToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as any };
  return jwt.sign({ ...payload }, env.JWT_SECRET, options);
}

export function signRefreshToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY as any };
  return jwt.sign({ ...payload }, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
}
