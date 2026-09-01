import { vi } from 'vitest';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/prisma';
import { truncateDb } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../src/env';

vi.mock('../../src/modules/admin/queues.routes', () => {
  const express = require('express');
  return { 
    default: express.Router(),
    checkQueueHealth: (req: any, res: any) => res.json({ status: 'mocked' })
  };
});

vi.mock('../../src/common/utils/queue', () => ({
  notificationFanoutQueue: { add: vi.fn() },
  jobExpirationQueue: { add: vi.fn() },
  pushNotificationQueue: { add: vi.fn(), addBulk: vi.fn() },
  redisConnection: {}
}));

describe('Direct Inquiry Rate Limiting and Creation', () => {
  let posterToken: string;
  let lawyerIds: string[] = [];

  beforeAll(async () => {
    // Note: If tests run against real Redis, we need to ensure the key is cleared.
    const { cache } = await import('../../src/common/utils/cache');
    await cache.del('rate_limit:direct_inquiry:test_poster_id');
  });

  beforeEach(async () => {
    const hash = await bcrypt.hash('password123', 10);
    
    // Create Poster
    const poster = await prisma.user.create({
      data: {
        id: 'test_poster_id', // explicit ID to match our cache clear
        email: `poster_${uuidv4()}@test.com`,
        passwordHash: hash,
        fullName: 'Poster',
        
        verificationStatus: 'APPROVED'
      }
    });
    posterToken = jwt.sign({ userId: poster.id, email: poster.email, role: poster.role }, env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

    // Create a pool of lawyers
    for (let i = 0; i < 17; i++) {
      const lawyer = await prisma.user.create({
        data: {
          email: `lawyer_${uuidv4()}@test.com`,
          passwordHash: hash,
          fullName: 'Lawyer',
          role: 'LAWYER',
          verificationStatus: 'APPROVED'
        } as Prisma.UserCreateInput
      });
      lawyerIds.push(lawyer.id);
    }
  });

  afterEach(async () => {
    await truncateDb();
    lawyerIds = [];
    const { cache } = await import('../../src/common/utils/cache');
    await cache.del('rate_limit:direct_inquiry:test_poster_id');
  });

  it('allows creating a direct inquiry', async () => {
    const response = await request(app)
      .post('/api/chat/direct')
      .set('Authorization', `Bearer ${posterToken}`)
      .send({ lawyerId: lawyerIds[0] });

    expect(response.status).toBe(201);
    expect(response.body.type).toBe('DIRECT_INQUIRY');
  });

  it('returns the same conversation when hitting the same lawyer twice', async () => {
    const response1 = await request(app)
      .post('/api/chat/direct')
      .set('Authorization', `Bearer ${posterToken}`)
      .send({ lawyerId: lawyerIds[0] });

    const response2 = await request(app)
      .post('/api/chat/direct')
      .set('Authorization', `Bearer ${posterToken}`)
      .send({ lawyerId: lawyerIds[0] });

    expect(response1.status).toBe(201);
    expect(response2.status).toBe(201); // The app might return 200 or 201 for existing, assuming 201 here or just checking body
    expect(response1.body.id).toBe(response2.body.id);
  });

  it('rate limits users after 15 inquiries in a 24-hour period', async () => {
    // 15 successful requests
    for (let i = 0; i < 15; i++) {
      const response = await request(app)
        .post('/api/chat/direct')
        .set('Authorization', `Bearer ${posterToken}`)
        .send({ lawyerId: lawyerIds[i] });
      
      expect(response.status).toBe(201);
    }

    // 16th request should fail
    const response16 = await request(app)
      .post('/api/chat/direct')
      .set('Authorization', `Bearer ${posterToken}`)
      .send({ lawyerId: lawyerIds[15] });

    expect(response16.status).toBe(429);
    expect(response16.body.error).toMatch(/maximum number/i);
  });
});
