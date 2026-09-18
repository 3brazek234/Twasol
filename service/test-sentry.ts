import './src/instrument';
import express from 'express';
import * as Sentry from '@sentry/node';

const app = express();
app.get('/debug-sentry', (_req, _res) => {
  throw new Error('My first Sentry error!');
});
Sentry.setupExpressErrorHandler(app);

const server = app.listen(4005, async () => {
  console.log('Server running on 4005');
  try {
    const res = await fetch('http://localhost:4005/debug-sentry');
    console.log('Fetch result:', res.status);
  } catch (err) {
    console.error('Fetch error:', err);
  }
  
  // Wait a moment for Sentry to flush
  setTimeout(() => {
    server.close();
    process.exit(0);
  }, 2000);
});
