import { vi } from 'vitest';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import app from '../../src/app'; // default export from src/app.ts
import { prisma } from '../../src/prisma';
import { truncateDb } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../src/env';

// Make sure to mock the queue if any integration test hits an endpoint that enqueues jobs
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
  cleanupQueue: { add: vi.fn() },
  redisConnection: {}
}));

describe('Verification Gating Integration Tests', () => {
  let unverifiedToken: string;
  let approvedToken: string;

  beforeEach(async () => {
    const hash = await bcrypt.hash('password123', 10);
    
    // Create Unverified User
    const unverifiedUser = await prisma.user.create({
      data: {
        email: `unverified_${uuidv4()}@test.com`,
        passwordHash: hash,
        fullName: 'Unverified Lawyer',
        role: 'LAWYER',
        verificationStatus: 'UNVERIFIED'
      }
    });
    unverifiedToken = jwt.sign(
      { userId: unverifiedUser.id, email: unverifiedUser.email, role: unverifiedUser.role },
      env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create Approved User
    const approvedUser = await prisma.user.create({
      data: {
        email: `approved_${uuidv4()}@test.com`,
        passwordHash: hash,
        fullName: 'Approved Lawyer',
        role: 'LAWYER',
        verificationStatus: 'APPROVED'
      }
    });
    approvedToken = jwt.sign(
      { userId: approvedUser.id, email: approvedUser.email, role: approvedUser.role },
      env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterEach(async () => {
    await truncateDb();
    vi.clearAllMocks();
  });

  it('allows unverified users to browse jobs (GET /api/jobs)', async () => {
    const response = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${unverifiedToken}`);
    
    expect(response.status).toBe(200);
  });

  it('prevents unverified users from posting jobs (POST /api/jobs)', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({
        title: 'Test Job',
        description: 'Test description',
        expiresInHours: 2,
        courtIds: [],
      });
    
    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/verified/i);
  });

  it('allows approved users to post jobs (POST /api/jobs)', async () => {
    const response = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({
        title: 'Test Job',
        description: 'Test description',
        expiresInHours: 2,
        courtIds: [],
      });
    
    expect(response.status).toBe(201);
  });
});
