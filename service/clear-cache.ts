import Redis from 'ioredis'; const cache = new Redis('redis://localhost:6379'); cache.del('governorates:all').then(() => { console.log('Cleared'); process.exit(0); });
