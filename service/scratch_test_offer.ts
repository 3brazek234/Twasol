import { PrismaClient, OfferStatus, JobStatus } from '@prisma/client';
import { ChatService } from './src/modules/chat/chat.service';

const API = 'http://localhost:4001/api';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Offer Race Condition...');
  try {
    // We already have poster and candidate from before, but let's just grab the first two users
    const users = await prisma.user.findMany({ take: 2 });
    if (users.length < 2) throw new Error('Not enough users');
    const poster = users[0];
    const candidate = users[1];

    // Ensure poster is verified
    await prisma.user.update({ where: { id: poster.id }, data: { verificationStatus: 'APPROVED', isActive: true }});
    await prisma.user.update({ where: { id: candidate.id }, data: { verificationStatus: 'APPROVED', accountMode: 'BOTH', isActive: true }});

    // Login poster
    let res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: poster.email, password: 'password' })
    });
    const posterToken = (await res.json()).data.accessToken;

    // Login candidate
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: candidate.email, password: 'password' })
    });
    const candidateToken = (await res.json()).data.accessToken;

    // Get a court and PA
    const court = await prisma.court.findFirstOrThrow();
    const practiceArea = await prisma.practiceArea.findFirstOrThrow();
    await prisma.courtPracticeArea.upsert({
      where: { courtId_practiceAreaId: { courtId: court.id, practiceAreaId: practiceArea.id } },
      update: {},
      create: { courtId: court.id, practiceAreaId: practiceArea.id }
    });
    await prisma.userPracticeArea.upsert({
      where: { userId_practiceAreaId: { userId: poster.id, practiceAreaId: practiceArea.id } },
      update: {},
      create: { userId: poster.id, practiceAreaId: practiceArea.id }
    });
    await prisma.userPracticeArea.upsert({
      where: { userId_practiceAreaId: { userId: candidate.id, practiceAreaId: practiceArea.id } },
      update: {},
      create: { userId: candidate.id, practiceAreaId: practiceArea.id }
    });
    await prisma.lawyerCourt.upsert({
      where: { userId_courtId: { userId: candidate.id, courtId: court.id } },
      update: {},
      create: { userId: candidate.id, courtId: court.id }
    });

    // Create job
    res = await fetch(`${API}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${posterToken}` },
      body: JSON.stringify({
        title: 'Race Condition Test Job',
        description: 'Test job for offers.',
        courtIds: [court.id],
        practiceAreaId: practiceArea.id,
        salaryMin: '100',
        salaryMax: '200'
      })
    });
    if (res.status !== 201) throw new Error('Job creation failed: ' + res.status + ' ' + await res.text());
    const job = (await res.json()).data;
    console.log('[1] Created Job:', job.id);

    // Apply to job (candidate)
    res = await fetch(`${API}/jobs/${job.id}/apply`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${candidateToken}` }
    });
    if (res.status !== 200 && res.status !== 201) throw new Error('Apply failed: ' + res.status + ' ' + await res.text());
    let application = (await res.json()).data;
    console.log('[2] Candidate Applied.');

    // Fetch conversation
    const conversation = await prisma.conversation.findFirstOrThrow({
      where: { jobId: job.id }
    });
    console.log('[3] Conversation ID:', conversation.id);

    // Candidate sends an OFFER message
    const offerMessage = await ChatService.sendMessage(
      conversation.id,
      candidate.id,
      { content: 'I will do it for 150', type: 'OFFER', offerAmount: '150' },
      'LAWYER'
    );
    console.log('[4] Candidate sent offer message:', offerMessage.id);

    // Now, fire two concurrent accept requests from poster!
    console.log('[5] Firing concurrent accept requests from poster...');
    
    const p1 = ChatService.acceptOffer(offerMessage.id, poster.id, '127.0.0.1').then(() => 'success').catch(e => e.message);
    const p2 = ChatService.acceptOffer(offerMessage.id, poster.id, '127.0.0.1').then(() => 'success').catch(e => e.message);
    
    const [res1, res2] = await Promise.all([p1, p2]);
    console.log(`[6] Results -> Req1: ${res1}, Req2: ${res2}`);
    
    // Verify one passed and one failed with conflict
    const statuses = [res1, res2];
    if (statuses.includes('success') && statuses.some(s => s !== 'success')) {
      console.log('✔ Race condition handled correctly: Exactly one success and one conflict');
    } else {
      console.error(`❌ Race condition failed! Results: Req1: ${res1}, Req2: ${res2}`);
    }
    
    // Check DB state
    const dbJob = await prisma.job.findUnique({ where: { id: job.id }});
    const dbOfferMsg = await prisma.message.findUnique({ where: { id: offerMessage.id }});
    
    if (dbJob?.status === JobStatus.AGREED && dbOfferMsg?.offerStatus === OfferStatus.ACCEPTED) {
      console.log('✔ DB state is valid: Job is AGREED and Offer is ACCEPTED');
    } else {
      console.error(`❌ DB state invalid! Job status: ${dbJob?.status}, Offer status: ${dbOfferMsg?.offerStatus}`);
    }

  } catch(err: any) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
