import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'add_conflict_declarations.sql'), 'utf-8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const statement of statements) {
    console.log('Executing:', statement);
    await prisma.$executeRawUnsafe(statement + ';');
  }
  console.log('Migration applied successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
