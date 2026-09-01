import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import { authLimiter } from '../../common/middleware/rateLimiter';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';
import { AuthController } from './auth.controller';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login',    authLimiter, validate(loginSchema),    AuthController.login);
router.post('/refresh',  validate(refreshSchema),               AuthController.refresh);

export default router;
