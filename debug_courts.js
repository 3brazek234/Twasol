
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Redis = require("ioredis");

async function main() {
  console.log("=== LAYER 1: RAW DATA ===");
  
  // 1. Total court count by type
  const countsByType = await prisma.$queryRaw`SELECT type, COUNT(*) as count FROM courts GROUP BY type ORDER BY count DESC;`;
  console.log("1. Courts by type:");
  countsByType.forEach(c => console.log(`  ${c.type}: ${c.count}`));

  // 2. NULL governorateId where not CASSATION
  const missingGov = await prisma.$queryRaw`SELECT id, "nameAr", type, "governorateId" FROM courts WHERE "governorateId" IS NULL AND type != 'CASSATION';`;
  console.log("2. Missing governorateId (non-Cassation):", missingGov.length);
  if (missingGov.length > 0) console.log(missingGov.slice(0, 5));

  // 3. Orphaned parentCourtId
  const orphaned = await prisma.$queryRaw`SELECT id, "nameAr", "parentCourtId" FROM courts WHERE "parentCourtId" IS NOT NULL AND "parentCourtId" NOT IN (SELECT id FROM courts);`;
  console.log("3. Orphaned parentCourtId:", orphaned.length);

  // 4. Total row count
  const total = await prisma.$queryRaw`SELECT COUNT(*) as count FROM courts;`;
  console.log("4. Total courts:", total[0].count);

  console.log("\n=== LAYER 3: REDIS CACHE ===");
  try {
    const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    const keys = await redis.keys("courts:list:*");
    console.log("Redis keys matching courts:list:* :", keys);
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      console.log(`Key: ${key}, TTL: ${ttl}`);
    }
    redis.disconnect();
  } catch(e) {
    console.log("Redis check failed:", e.message);
  }

  prisma.$disconnect();
}

main().catch(console.error);
