import { Router } from 'express';
import { validate } from '../../common/middleware/validate';
import { authenticate } from '../../common/middleware/authenticate';
import { authLimiter } from '../../common/middleware/rateLimiter';
import { registerSchema, loginSchema, refreshSchema, requestPasswordResetSchema, verifyOtpSchema, resetPasswordSchema } from './auth.schema';
import { AuthController } from './auth.controller';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), AuthController.register);
router.post('/login',    authLimiter, validate(loginSchema),    AuthController.login);
router.post('/refresh',  validate(refreshSchema),               AuthController.refresh);
router.post('/google',   authLimiter,                           AuthController.googleSignIn);

import { passwordResetLimiter } from '../../common/middleware/rateLimiter';
router.post('/forgot-password', authLimiter, passwordResetLimiter, validate(requestPasswordResetSchema), AuthController.requestPasswordReset);
router.post('/verify-otp',      authLimiter, passwordResetLimiter, validate(verifyOtpSchema),            AuthController.verifyOtp);
router.post('/reset-password',  authLimiter, passwordResetLimiter, validate(resetPasswordSchema),        AuthController.resetPassword);

router.patch('/complete-profile', authenticate,                 AuthController.completeProfile);
router.get('/me',        authenticate,                          AuthController.me);

export default router;
