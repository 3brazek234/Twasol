import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { verifyAccessToken } from '../common/utils/jwt';
import cookie from 'cookie';
import { registerPresenceHandlers, handleDisconnect } from '../modules/presence/presence.gateway';
import { registerChatHandlers } from '../modules/chat/chat.gateway';
import { env } from '../env';
import { logger } from '../common/utils/logger';

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true }
  });

  const pubClient = new Redis(env.REDIS_URL || 'redis://localhost:6379');
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const tokenAuth = socket.handshake.auth?.token;
      
      if (env.DEBUG_SOCKET_AUTH) {
        logger.debug(`[SOCKET AUTH] New handshake attempt — socket.id=${socket.id}, hasCookie=${!!cookieHeader}, hasAuthToken=${!!tokenAuth}`);
      }
      
      // 1. Rate limiting by IP
      const clientIp = socket.handshake.address;
      const rateLimitKey = `rate-limit:socket:${clientIp}`;
      const currentAttempts = await pubClient.incr(rateLimitKey);
      if (currentAttempts === 1) {
        await pubClient.expire(rateLimitKey, 60); // 1 minute window
      }
      if (currentAttempts > 30) {
        return next(new Error('Rate limit exceeded'));
      }

      // 2. Authentication
      let token = socket.handshake.auth?.token;
      
      if (!token && socket.handshake.headers.cookie) {
        const cookies = cookie.parse(socket.handshake.headers.cookie);
        token = cookies.accessToken;
      }

      if (!token) {
        return next(new Error('Authentication error'));
      }
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      
      // Calculate remaining TTL of token
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp || (now + 3600); // Default 1h if missing
      const expiresInSecs = exp - now;
      if (expiresInSecs > 0) {
        // Schedule a proactive disconnect when token expires
        socket.data.expiryTimer = setTimeout(() => {
          socket.emit('token_expired', { message: 'Session expired. Please reconnect with a fresh token.' });
          socket.disconnect(true);
        }, expiresInSecs * 1000);
      } else {
        return next(new Error('Authentication error'));
      }

      if (!socket.handshake.auth?.token && socket.handshake.headers.cookie) {
        if (env.DEBUG_SOCKET_AUTH) logger.debug(`[SOCKET AUTH] ✅ COOKIE AUTH SUCCESS — socket.id=${socket.id}, userId=${payload.userId}, role=${payload.role}`);
      } else {
        if (env.DEBUG_SOCKET_AUTH) logger.debug(`[SOCKET AUTH] ✅ TOKEN AUTH SUCCESS — socket.id=${socket.id}, userId=${payload.userId}, role=${payload.role}`);
      }

      next();
    } catch (err: any) {
      if (env.DEBUG_SOCKET_AUTH) logger.debug(`[SOCKET AUTH] ❌ REJECTED — socket.id=${socket.id}, reason=${err.message}`);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      socket.join('admins');
      if (env.DEBUG_SOCKET_AUTH) logger.debug(`[SOCKET AUTH] ✅ Joined 'admins' room — socket.id=${socket.id}, userId=${userId}`);
    }
    
    await registerPresenceHandlers(io, socket, userId, pubClient);
    registerChatHandlers(io, socket, userId);

    socket.on('disconnect', async () => {
      if (socket.data.expiryTimer) {
        clearTimeout(socket.data.expiryTimer);
      }
      await handleDisconnect(socket, userId, pubClient);
    });
  });

  return io;
}
