import { vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { ChatService } from '../../src/modules/chat/chat.service';
import { prisma } from '../../src/prisma';
import { AppError } from '../../src/common/errors/AppError';
import { truncateDb } from '../utils';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { JobStatus, OfferStatus, MessageType } from '@prisma/client';

describe('Offer CAS Logic (Race Condition Prevention)', () => {
  let testMessageId: string;
  let testUserId: string; // The user who accepts (e.g. poster)
  let targetUserId: string; // The lawyer who sent the offer
  let testJobId: string;
  let testConversationId: string;

  beforeEach(async () => {
    // 1. Seed DB
    const hash = await bcrypt.hash('password123', 10);
    
    // Create Poster
    const poster = await prisma.user.create({
      data: {
        email: `poster_${uuidv4()}@test.com`,
        passwordHash: hash,
        fullName: 'Test Poster',
        role: 'USER'
      } as Prisma.UserCreateInput
    });
    testUserId = poster.id;

    // Create Lawyer
    const lawyer = await prisma.user.create({
      data: {
        email: `lawyer_${uuidv4()}@test.com`,
        passwordHash: hash,
        fullName: 'Test Lawyer',
        role: 'LAWYER',
        verificationStatus: 'APPROVED'
      }
    });
    targetUserId = lawyer.id;

    // Create Job
    const job = await prisma.job.create({
      data: {
        title: 'Test Job for Offer',
        description: 'Testing CAS logic',
        status: JobStatus.NEGOTIATING,
        postedByUserId: testUserId,
      }
    });
    testJobId = job.id;

    // Create Conversation
    const conversation = await prisma.conversation.create({
      data: {
        jobId: job.id,
        type: 'JOB',
        participants: {
          create: [
            { userId: testUserId },
            { userId: targetUserId }
          ]
        }
      }
    });
    testConversationId = conversation.id;

    // Create Message with Offer
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: targetUserId,
        content: 'I can do this for 500',
        type: MessageType.OFFER,
        offerAmount: '500',
        offerStatus: OfferStatus.PENDING
      }
    });
    testMessageId = message.id;
  });

  afterEach(async () => {
    // 2. Truncate DB tables between tests
    await truncateDb();
  });

  it('should successfully accept a pending offer', async () => {
    const res = await ChatService.acceptOffer(testMessageId, testUserId);
    expect(res.offerStatus).toBe(OfferStatus.ACCEPTED);
    
    const job = await prisma.job.findUnique({ where: { id: testJobId } });
    expect(job?.status).toBe(JobStatus.AGREED);
    expect(job?.assignedLawyerId).toBe(targetUserId);
  });

  it('should reject concurrent accept requests, allowing exactly ONE success and ONE 409 Conflict', async () => {
    // Fire both requests concurrently
    const results = await Promise.allSettled([
      ChatService.acceptOffer(testMessageId, testUserId),
      ChatService.acceptOffer(testMessageId, testUserId),
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Exactly one should succeed
    expect(fulfilled).toHaveLength(1);
    
    // Exactly one should fail due to the CAS updateMany count === 0
    expect(rejected).toHaveLength(1);
    
    // Assert the failure is specifically our custom 409 Conflict AppError
    const reason = (rejected[0] as PromiseRejectedResult).reason as AppError;
    expect(reason).toBeInstanceOf(AppError);
    expect(reason.statusCode).toBe(409);
    expect(reason.message).toMatch(/no longer pending/i);

    // Verify DB state accurately reflects the single success
    const msg = await prisma.message.findUnique({ where: { id: testMessageId } });
    expect(msg?.offerStatus).toBe(OfferStatus.ACCEPTED);
    
    const job = await prisma.job.findUnique({ where: { id: testJobId } });
    expect(job?.status).toBe(JobStatus.AGREED); // Ensure the transaction committed the job update
  });
  
  it('should prevent accepting an already rejected offer', async () => {
     await ChatService.rejectOffer(testMessageId, testUserId);
     
     await expect(ChatService.acceptOffer(testMessageId, testUserId))
       .rejects.toMatchObject({ statusCode: 409 });
  });

  it('should roll back if transaction fails mid-way', async () => {
    // We can simulate a failure by doing something that violates a DB constraint or mocking auditLog to throw.
    // Let's use vi.mock or spy to make auditLog throw an error.
    const auditModule = await import('../../src/common/utils/audit');
    const spy = vi.spyOn(auditModule, 'auditLog').mockRejectedValueOnce(new Error('Simulated audit failure'));

    await expect(ChatService.acceptOffer(testMessageId, testUserId))
      .rejects.toThrow('Simulated audit failure');

    // The message should still be PENDING, and the job NEGOTIATING (transaction rolled back)
    const msg = await prisma.message.findUnique({ where: { id: testMessageId } });
    expect(msg?.offerStatus).toBe(OfferStatus.PENDING);
    
    const job = await prisma.job.findUnique({ where: { id: testJobId } });
    expect(job?.status).toBe(JobStatus.NEGOTIATING);

    spy.mockRestore();
  });
});
