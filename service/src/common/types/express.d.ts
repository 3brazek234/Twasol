// src/common/types/express.d.ts
import { TokenPayload } from '../utils/jwt';
import { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      requestId?: string;
      log?: Logger;
    }
  }
}
