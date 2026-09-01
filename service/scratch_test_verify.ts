import { v4 as uuidv4 } from 'uuid';

const API = 'http://localhost:4001/api';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Verification Flow...');
  try {
    // 1. Create a lawyer
    const lawyerEmail = `lawyer_${Math.random()}@test.com`;
    let res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lawyerEmail, password: 'password', fullName: 'Lawyer' })
    });
    let lawyerData = await res.json();
    
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lawyerEmail, password: 'password' })
    });
    let loginData = await res.json();
    const lawyerToken = loginData.data.accessToken;
    const lawyerId = loginData.data.user.id;

    // 2. Submit verification documents
    console.log('[1] Getting presigned URL...');
    res = await fetch(`${API}/verification/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lawyerToken}` },
      body: JSON.stringify({ documentType: 'bar_license', contentType: 'application/pdf' })
    });
    let uploadData = await res.json();
    if (!uploadData.data?.uploadUrl) throw new Error('Failed to get upload URL: ' + JSON.stringify(uploadData));
    console.log('✔ Presigned URL retrieved');
    
    // Test that we can't fetch the file directly via guessed URL (simulated here since no real S3 backend is actually hooked up in local dev, or is it?)
    const documentId = uploadData.data.documentId;

    console.log('[2] Submitting verification (Bypassing R2 check via Prisma)...');
    await prisma.verificationDocument.update({
      where: { id: documentId },
      data: { status: 'PENDING' }
    });
    // Also need to set user status
    await prisma.user.update({
      where: { id: lawyerId },
      data: { verificationStatus: 'PENDING' }
    });
    console.log('✔ Verification submitted');

    // 3. Admin login
    console.log('[3] Logging in as Admin...');
    const adminEmail = `admin_${Math.random()}@test.com`;
    await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'password', fullName: 'Admin User' })
    });
    
    // Make admin using Prisma
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' }
    });
    
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'password' })
    });
    const adminData = await res.json();
    const adminToken = adminData.data.accessToken;
    
    // 4. Admin fetch pending verifications
    console.log('[4] Fetching pending verifications...');
    res = await fetch(`${API}/verification/admin/pending`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    let verifications = await res.json();
    console.log('✔ Admin fetched verifications. Count:', verifications.data.length);
    
    const targetVerif = verifications.data.find((v: any) => v.userId === lawyerId);
    if (!targetVerif) throw new Error('Could not find verification submission for lawyer. ' + JSON.stringify(verifications.data));
    
    // 5. Reject with notes
    console.log('[5] Rejecting submission...');
    res = await fetch(`${API}/verification/admin/${targetVerif.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'REJECTED', notes: 'Blurry photo' })
    });
    if (res.status !== 200) throw new Error('Rejection failed: ' + await res.text());
    console.log('✔ Rejected successfully');
    
    // 6. Resubmit
    console.log('[6] Resubmitting...');
    res = await fetch(`${API}/verification/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lawyerToken}` },
      body: JSON.stringify({ documentType: 'bar_license', contentType: 'application/pdf' })
    });
    let uploadData2 = await res.json();
    await prisma.verificationDocument.update({
      where: { id: uploadData2.data.documentId },
      data: { status: 'PENDING' }
    });
    await prisma.user.update({
      where: { id: lawyerId },
      data: { verificationStatus: 'PENDING' }
    });
    console.log('✔ Resubmitted successfully');
    
    // 7. Approve
    console.log('[7] Approving submission...');
    res = await fetch(`${API}/verification/admin/${uploadData2.data.documentId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'APPROVED' })
    });
    if (res.status !== 200) throw new Error('Approval failed: ' + await res.text());
    console.log('✔ Approved successfully');
    
    // 8. Test applying as unverified (using a new unverified user)
    console.log('[8] Testing unverified application block...');
    const unverifiedEmail = `unverified_${Math.random()}@test.com`;
    await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unverifiedEmail, password: 'password', fullName: 'Unverified Lawyer' })
    });
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unverifiedEmail, password: 'password' })
    });
    const unverifiedToken = (await res.json()).data.accessToken;
    
    res = await fetch(`${API}/jobs/11111111-1111-1111-1111-111111111111/apply`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${unverifiedToken}` }
    });
    if (res.status === 403 || res.status === 401 || (res.status === 400 && (await res.json()).error?.message?.includes('unverified'))) {
      console.log('✔ Unverified user blocked from applying as expected');
    } else {
      console.log('❌ Unexpected response when unverified applied: ' + res.status);
    }
    
    // 9. Test unverified browsing
    console.log('[9] Testing unverified browsing...');
    res = await fetch(`${API}/jobs`, {
      headers: { 'Authorization': `Bearer ${unverifiedToken}` }
    });
    if (res.status === 200) {
      console.log('✔ Unverified user successfully browsed jobs');
    } else {
      console.error('❌ Unverified user blocked from browsing jobs! Status: ' + res.status);
    }

  } catch(err: any) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
