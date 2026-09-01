import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'prisma/migrations/20260812231600_add_practice_areas/migration.sql'), 'utf-8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const statement of statements) {
    if (!statement.startsWith('--')) { // skip pure comments
      console.log('Executing:', statement);
      await prisma.$executeRawUnsafe(statement + ';');
    }
  }
  console.log('Migration applied successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
