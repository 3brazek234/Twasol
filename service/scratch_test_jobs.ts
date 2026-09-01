import { PrismaClient } from '@prisma/client';
import './src/workers/notification-fanout.worker';

const API = 'http://localhost:4001/api';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Job Posting & Notifications...');
  try {
    // Ensure we have a court and practice area
    const court = await prisma.court.findFirstOrThrow();
    const practiceArea = await prisma.practiceArea.findFirstOrThrow();
    
    // Link them so the job can be posted
    await prisma.courtPracticeArea.upsert({
      where: { courtId_practiceAreaId: { courtId: court.id, practiceAreaId: practiceArea.id } },
      update: {},
      create: { courtId: court.id, practiceAreaId: practiceArea.id }
    });

    // 1. Create Poster Lawyer
    const posterEmail = `poster_${Math.random()}@test.com`;
    await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: posterEmail, password: 'password', fullName: 'Poster' })
    });
    
    await prisma.user.update({
      where: { email: posterEmail },
      data: { verificationStatus: 'APPROVED' } // bypass verification
    });
    
    const posterUser = await prisma.user.findUniqueOrThrow({ where: { email: posterEmail } });
    await prisma.userPracticeArea.create({
      data: { userId: posterUser.id, practiceAreaId: practiceArea.id }
    });
    
    let res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: posterEmail, password: 'password' })
    });
    const posterToken = (await res.json()).data.accessToken;

    // 2. Create Candidate Lawyer with matching court and practice area
    const candidateEmail = `candidate_${Math.random()}@test.com`;
    await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: candidateEmail, password: 'password', fullName: 'Candidate' })
    });
    
    const candidate = await prisma.user.update({
      where: { email: candidateEmail },
      data: { 
        verificationStatus: 'APPROVED',
        accountMode: 'BOTH'
      }
    });

    // Set candidate's practice areas and courts
    await prisma.userPracticeArea.create({
      data: { userId: candidate.id, practiceAreaId: practiceArea.id }
    });
    await prisma.lawyerCourt.create({
      data: { userId: candidate.id, courtId: court.id }
    });
    
    console.log('[1] Created poster and matching candidate');

    // 3. Post a job
    console.log('[2] Posting a job...');
    res = await fetch(`${API}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${posterToken}` },
      body: JSON.stringify({
        title: 'Need coverage at Test Court',
        description: 'Need coverage for a quick hearing.',
        courtIds: [court.id],
        practiceAreaId: practiceArea.id,
        salaryMin: '100.00',
        salaryMax: '150.00'
      })
    });
    
    if (res.status !== 201) throw new Error('Job creation failed: ' + res.status + ' ' + await res.text());
    const job = (await res.json()).data;
    console.log('✔ Job created. ID:', job.id);

    // 4. Wait for BullMQ worker to fan out notifications
    console.log('[3] Waiting for notification fanout...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check notifications for candidate
    const notifications = await prisma.notification.findMany({
      where: { userId: candidate.id }
    });
    
    if (notifications.length > 0) {
      console.log('✔ Candidate received notification successfully:', notifications[0].type);
    } else {
      console.error('❌ Candidate did NOT receive notification. Check if BullMQ worker is running or if logic failed.');
    }

  } catch(err: any) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
