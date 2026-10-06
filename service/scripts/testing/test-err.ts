import { verifyAccessToken, signAccessToken } from './src/common/utils/jwt';
console.log(signAccessToken({ userId: 'test-user', role: 'SUPER_ADMIN', email: 'test@example.com' } as any));
