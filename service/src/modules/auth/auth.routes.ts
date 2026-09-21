import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { authLimiter } from '../../common/middleware/rateLimiter';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';
import { AuthController } from './auth.controller';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login',    authLimiter, validate(loginSchema),    AuthController.login);
router.post('/refresh',  validate(refreshSchema),               AuthController.refresh);
router.post('/google',   authLimiter,                           AuthController.googleSignIn);
router.patch('/complete-profile', authenticate,                 AuthController.completeProfile);
router.get('/me',        authenticate,                          AuthController.me);

export default router;
