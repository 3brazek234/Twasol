import { signAccessToken } from './src/common/utils/jwt';
console.log(signAccessToken({ userId: 'test-user', role: 'ADMIN', email: 'test@example.com' } as any));
