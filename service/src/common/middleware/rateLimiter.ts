// src/common/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for auth endpoints — 10 requests per minute per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests, try again later' } },
});

/**
 * Rate limiter for job posting — 20 requests per minute per IP.
 */
export const jobPostLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests, try again later' } },
});

/**
 * General API rate limiter — 100 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests, try again later' } },
});

/**
 * Rate limiter for writing reviews — 20 requests per minute per USER.
 */
export const reviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user!.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'أنت ترسل التقييمات بسرعة كبيرة، يرجى الانتظار قليلاً' } },
});

/**
 * Rate limiter for sending chat messages — 60 requests per minute per USER.
 * Higher threshold accommodates fast, bursty typing during negotiations.
 */
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user!.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT', message: 'أنت ترسل الرسائل بسرعة كبيرة، يرجى الانتظار قليلاً' } },
});
