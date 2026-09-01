import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { prisma } from '../../prisma';

export async function registerPresenceHandlers(io: Server, socket: Socket, userId: string, redis: Redis) {
  await redis.sadd(`presence:${userId}`, socket.id);
  await prisma.user.updateMany({ where: { id: userId }, data: { isOnline: true } });
  
  socket.join(`user:${userId}`);

  const courts = await prisma.lawyerCourt.findMany({
    where: { userId, isActive: true }
  });

  for (const court of courts) {
    socket.join(`court:${court.courtId}`);
  }
}

export async function handleDisconnect(socket: Socket, userId: string, redis: Redis) {
  await redis.srem(`presence:${userId}`, socket.id);
  const remaining = await redis.scard(`presence:${userId}`);
  if (remaining === 0) {
    await prisma.user.updateMany({ where: { id: userId }, data: { isOnline: false } });
  }
}
