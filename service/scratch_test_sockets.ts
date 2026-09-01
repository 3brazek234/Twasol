import { io } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import cookie from 'cookie';

const API = 'http://localhost:4001/api';
const SOCKET_URL = 'http://localhost:4001';
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Admin Socket Auth & Events...');
  try {
    // 1. Get an admin token
    const admin = await prisma.user.findFirstOrThrow({ where: { role: 'ADMIN' } });
    
    let res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: admin.email, password: 'password123' })
    });
    const adminToken = (await res.json()).data.accessToken;

    // Simulate cookie auth for admin (socket to root namespace)
    const adminSocket = io(SOCKET_URL, {
      extraHeaders: {
        Cookie: cookie.serialize('accessToken', adminToken)
      }
    });

    console.log('[1] Connecting Admin Socket...');
    await new Promise((resolve, reject) => {
      adminSocket.on('connect', resolve);
      adminSocket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Admin socket timeout')), 5000);
    });
    console.log('✔ Admin socket connected successfully via cookie!');

    // 2. Get a lawyer token
    const lawyer = await prisma.user.findFirstOrThrow({ where: { role: 'LAWYER' } });
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lawyer.email, password: 'password' })
    });
    const lawyerToken = (await res.json()).data.accessToken;

    console.log('[2] Connecting Lawyer Socket...');
    const lawyerSocket = io(SOCKET_URL, {
      auth: { token: lawyerToken }
    });

    await new Promise((resolve, reject) => {
      lawyerSocket.on('connect', resolve);
      lawyerSocket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Lawyer socket timeout')), 5000);
    });
    console.log('✔ Lawyer socket connected successfully via token!');

    // 3. Test new signup event validation
    console.log('[3] Triggering a new signup...');
    
    let adminReceivedEvent = false;
    let lawyerReceivedEvent = false;
    
    adminSocket.on('admin:new_signup', (data) => {
      adminReceivedEvent = true;
    });
    
    lawyerSocket.on('admin:new_signup', (data) => {
      lawyerReceivedEvent = true;
    });

    // Register a new user
    const newEmail = `new_${Math.random()}@test.com`;
    await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: 'password', fullName: 'New User' })
    });
    
    // Wait a bit for sockets to receive events
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (adminReceivedEvent) {
      console.log('✔ Admin successfully received admin:new_signup event!');
    } else {
      console.error('❌ Admin failed to receive admin:new_signup event!');
    }
    
    if (lawyerReceivedEvent) {
      console.error('❌ Security Flaw: Lawyer received admin:new_signup event!');
    } else {
      console.log('✔ Access Control verified: Lawyer did not receive admin event.');
    }

    adminSocket.disconnect();
    lawyerSocket.disconnect();

  } catch(err: any) {
    console.error('❌ Test failed with error:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
