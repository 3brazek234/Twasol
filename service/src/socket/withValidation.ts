import { ZodSchema } from 'zod';
import { Socket } from 'socket.io';
import { logger } from '../common/utils/logger';

/**
 * Socket.IO event handler wrapper that validates incoming data against a Zod schema.
 * 
 * In Socket.IO, event handlers receive (data, ack?) — the socket is `this`.
 * We capture the socket in the closure (from registerChatHandlers) instead.
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (data: T) => Promise<void>
) {
  return async function(this: Socket, rawData: unknown) {
    const socket = this;
    const result = schema.safeParse(rawData);
    if (!result.success) {
      logger.warn({ issues: result.error.issues }, 'Socket validation failed');
      socket.emit('error', {
        code: 'VALIDATION_ERROR',
        issues: result.error.flatten().fieldErrors,
      });
      return;
    }
    try {
      await handler(result.data);
    } catch (err: any) {
      logger.error({ err }, 'Socket handler error');
      socket.emit('error', { code: err.code || 'INTERNAL_ERROR', message: err.message });
    }
  };
}
