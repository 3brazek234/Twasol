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
  handler: (data: T, ack?: Function) => Promise<any>
) {
  return async function(this: Socket, rawData: unknown, ack?: Function) {
    const socket = this;
    const result = schema.safeParse(rawData);
    if (!result.success) {
      logger.warn({ issues: result.error.issues }, 'Socket validation failed');
      const errPayload = {
        code: 'VALIDATION_ERROR',
        issues: result.error.flatten().fieldErrors,
      };
      if (typeof ack === 'function') {
        ack({ error: errPayload });
      } else {
        socket.emit('error', errPayload);
      }
      return;
    }
    try {
      const response = await handler(result.data, ack);
      if (typeof ack === 'function' && response !== undefined) {
        ack(response);
      }
    } catch (err: any) {
      logger.error({ err }, 'Socket handler error');
      const errPayload = { code: err.code || 'INTERNAL_ERROR', message: err.message };
      if (typeof ack === 'function') {
        ack({ error: errPayload });
      } else {
        socket.emit('error', errPayload);
      }
    }
  };
}
