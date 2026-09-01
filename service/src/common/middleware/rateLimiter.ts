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
