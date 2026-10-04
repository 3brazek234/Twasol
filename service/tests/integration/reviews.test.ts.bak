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
import { JobStatus } from '@prisma/client';

describe('Reviews Integration Logic', () => {
  let posterId: string;
  let lawyerId: string;
  let posterToken: string;
  let lawyerToken: string;
  let jobId: string;

  beforeEach(async () => {
    const hash = await bcrypt.hash('password123', 10);
    
    // Create Poster
    const poster = await prisma.user.create({
      data: {
        email: `poster_${uuidv4()}@test.com`,
        passwordHash: hash,
        fullName: 'Poster',
        
        verificationStatus: 'APPROVED'
      } as Prisma.UserCreateInput
    });
    posterId = poster.id;
    posterToken = jwt.sign({ userId: poster.id, email: poster.email, role: poster.role }, env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

    // Create Lawyer
    const lawyer = await prisma.user.create({
      data: {
        email: `lawyer_${uuidv4()}@test.com`,
        passwordHash: hash,
        fullName: 'Lawyer',
        role: 'LAWYER',
        verificationStatus: 'APPROVED'
      }
    });
    lawyerId = lawyer.id;
    lawyerToken = jwt.sign({ userId: lawyer.id, email: lawyer.email, role: lawyer.role }, env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

    // Create Job (COMPLETED)
    const job = await prisma.job.create({
      data: {
        title: 'Review Test Job',
        description: 'Testing reviews',
        status: JobStatus.COMPLETED,
        postedByUserId: posterId,
        assignedLawyerId: lawyerId
      }
    });
    jobId = job.id;
  });

  afterEach(async () => {
    await truncateDb();
    vi.clearAllMocks();
  });

  it('rejects a review if job is not COMPLETED', async () => {
    // Change to IN_PROGRESS
    await prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.IN_PROGRESS } });

    const response = await request(app)
      .post(`/api/jobs/${jobId}/reviews`)
      .set('Authorization', `Bearer ${posterToken}`)
      .send({ rating: 5, comment: 'Great!' });
    
    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/must be completed/i);
  });

  it('allows job poster to review the assigned lawyer', async () => {
    const response = await request(app)
      .post(`/api/jobs/${jobId}/reviews`)
      .set('Authorization', `Bearer ${posterToken}`)
      .send({ rating: 4, comment: 'Good work' });
    
    expect(response.status).toBe(201);
    expect(response.body.data.rating).toBe(4);
    expect(response.body.data.revieweeId).toBe(lawyerId);
  });

  it('rejects duplicate reviews from the same user for the same job', async () => {
    // First review
    await request(app)
      .post(`/api/jobs/${jobId}/reviews`)
      .set('Authorization', `Bearer ${posterToken}`)
      .send({ rating: 4 });

    // Second review
    const response2 = await request(app)
      .post(`/api/jobs/${jobId}/reviews`)
      .set('Authorization', `Bearer ${posterToken}`)
      .send({ rating: 2, comment: 'Wait, no' });

    expect(response2.status).toBe(400);
    expect(response2.body.error.message).toMatch(/already reviewed/i);
  });

  it('computes the average rating correctly for a user', async () => {
    // Poster reviews Lawyer
    await prisma.review.create({
      data: {
        jobId,
        reviewerId: posterId,
        revieweeId: lawyerId,
        rating: 4
      }
    });

    // Create another job and review
    const job2 = await prisma.job.create({
      data: {
        title: 'Another Job',
        description: 'Test 2',
        status: JobStatus.COMPLETED,
        postedByUserId: posterId,
        assignedLawyerId: lawyerId
      }
    });

    await prisma.review.create({
      data: {
        jobId: job2.id,
        reviewerId: posterId,
        revieweeId: lawyerId,
        rating: 5
      }
    });

    const statsResponse = await request(app)
      .get(`/api/users/${lawyerId}/reviews/stats`)
      .set('Authorization', `Bearer ${posterToken}`);

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.averageRating).toBe(4.5);
    expect(statsResponse.body.reviewCount).toBe(2);
  });
});
