import { vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('Rate Limit Integration', () => {
  it('blocks requests after hitting the rate limit on auth endpoints', async () => {
    // authLimiter max is 10
    const limit = 10;
    
    // We send 10 requests, they should all be processed normally (even if it's 400 Bad Request due to bad payload)
    for (let i = 0; i < limit; i++) {
      await request(app).post('/api/auth/login').send({});
    }

    // The 11th request should return 429 Too Many Requests
    const response = await request(app).post('/api/auth/login').send({});
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMIT');
  });
});
