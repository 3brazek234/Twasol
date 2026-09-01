import { PrismaClient, ConversationType } from '@prisma/client';

const API = 'http://localhost:4001/api';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Support Chat Flow...');
  try {
    // 1. Get a lawyer and an admin
    const lawyer = await prisma.user.findFirstOrThrow({
      where: { role: 'LAWYER' }
    });
    const admin = await prisma.user.findFirstOrThrow({
      where: { role: 'ADMIN' } 
    });

    console.log(`[1] Found Lawyer: ${lawyer.email}, Admin: ${admin.email}`);

    // Get tokens for lawyer
    let res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lawyer.email, password: 'password' })
    });
    const lawyerToken = (await res.json()).data.accessToken;
    
    // Get tokens for admin
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: admin.email, password: 'password123' })
    });
    const adminToken = (await res.json()).data.accessToken;

    // 2. Lawyer creates a support conversation
    console.log('[2] Lawyer creating a support conversation...');
    res = await fetch(`${API}/support/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lawyerToken}` }
    });
    
    if (res.status === 200 || res.status === 201) {
       console.log('✔ Created support chat via API');
    } else {
       throw new Error('Support chat failed: ' + res.status + ' ' + await res.text());
    }

    // Get the conversation
    res = await fetch(`${API}/support/conversations/mine`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${lawyerToken}` }
    });
    if (res.status === 200) {
      console.log('✔ Fetched support chat via API');
    } else {
      throw new Error('Support chat get failed: ' + res.status + ' ' + await res.text());
    }

  } catch(err: any) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
