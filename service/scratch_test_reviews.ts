import { PrismaClient, JobStatus } from '@prisma/client';

const API = 'http://localhost:4001/api';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Reviews Flow...');
  try {
    // 1. Get a job that is ASSIGNED/AGREED or create one
    let job = await prisma.job.findFirst({
      where: { status: JobStatus.AGREED }
    });
    
    if (!job) {
      console.log('No AGREED job found. Using script to bypass and create one directly in DB.');
      const poster = await prisma.user.findFirstOrThrow();
      const candidate = await prisma.user.findFirstOrThrow({ skip: 1 });
      job = await prisma.job.create({
        data: {
          title: 'Review Test Job',
          description: 'A job for testing reviews.',
          status: JobStatus.COMPLETED,
          postedByUserId: poster.id,
          assignedLawyerId: candidate.id,
          agreedSalary: '100'
        }
      });
    } else {
      // Update job to COMPLETED
      job = await prisma.job.update({
        where: { id: job.id },
        data: { status: JobStatus.COMPLETED }
      });
    }

    console.log(`[1] Found/Created COMPLETED Job: ${job.id}`);

    // Get tokens for poster
    let res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: (await prisma.user.findUnique({where: {id: job.postedByUserId}}))!.email, password: 'password' })
    });
    const posterToken = (await res.json()).data.accessToken;

    // Get tokens for candidate
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: (await prisma.user.findUnique({where: {id: job.assignedLawyerId!}}))!.email, password: 'password' })
    });
    const candidateToken = (await res.json()).data.accessToken;

    // 2. Poster leaves a review for candidate
    console.log('[2] Poster leaving review (Rating: 4)...');
    res = await fetch(`${API}/jobs/${job.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${posterToken}` },
      body: JSON.stringify({ rating: 4, comment: 'Good job!' })
    });
    if (res.status !== 201) throw new Error('Review failed: ' + await res.text());
    console.log('✔ Poster review submitted');

    // 3. Candidate leaves a review for poster
    console.log('[3] Candidate leaving review (Rating: 5)...');
    res = await fetch(`${API}/jobs/${job.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${candidateToken}` },
      body: JSON.stringify({ rating: 5, comment: 'Great client!' })
    });
    if (res.status !== 201) throw new Error('Review failed: ' + await res.text());
    console.log('✔ Candidate review submitted');

    // 4. Test duplicate review (should fail)
    console.log('[4] Testing duplicate review block...');
    res = await fetch(`${API}/jobs/${job.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${candidateToken}` },
      body: JSON.stringify({ rating: 1, comment: 'Change my mind' })
    });
    if (res.status === 400) {
      console.log('✔ Duplicate review correctly blocked');
    } else {
      throw new Error(`Duplicate review not blocked (status: ${res.status})`);
    }

    // 5. Test Average Calculation
    console.log('[5] Checking Candidate stats...');
    // Add a second review for the candidate to test average
    const anotherPoster = await prisma.user.findFirstOrThrow({ skip: 2 });
    const job2 = await prisma.job.create({
      data: {
        title: 'Review Test Job 2',
        description: 'Another job.',
        status: JobStatus.COMPLETED,
        postedByUserId: anotherPoster.id,
        assignedLawyerId: job.assignedLawyerId,
        agreedSalary: '150'
      }
    });
    await prisma.review.create({
      data: {
        jobId: job2.id,
        reviewerId: anotherPoster.id,
        revieweeId: job.assignedLawyerId!,
        rating: 3,
        comment: 'Okay.'
      }
    });
    
    // Check candidate average (should be (4 + 3) / 2 = 3.5)
    res = await fetch(`${API}/users/${job.assignedLawyerId}/reviews`, {
      headers: { 'Authorization': `Bearer ${posterToken}` } // any logged in user can view stats
    });
    
    if (res.status !== 200) throw new Error('Failed to fetch stats: ' + await res.text());
    const statsData = await res.json();
    
    // Check the structure (does the endpoint return average rating in pagination?)
    console.log('✔ Stats Data fetched');
    
    // Check the actual stats using Prisma since the /reviews endpoint might just return pagination,
    // wait, is there a /stats endpoint? Let's check `ReviewsService.getUserStats`.
    const stats = await import('./src/modules/reviews/reviews.service').then(m => m.ReviewsService.getUserStats(job!.assignedLawyerId!));
    
    if (stats.averageRating === 3.5 && stats.reviewCount === 2) {
      console.log('✔ Average rating computes correctly (3.5 across 2 reviews)');
    } else {
      console.error(`❌ Average rating failed! Expected 3.5 (count 2), Got ${stats.averageRating} (count ${stats.reviewCount})`);
    }

  } catch(err: any) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
