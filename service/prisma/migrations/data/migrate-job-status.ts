import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function migrateJobStatuses() {
  const mapping: Record<string, string> = {
    open:        'OPEN',
    assigned:    'AGREED',
    in_progress: 'IN_PROGRESS',
    completed:   'COMPLETED',
    cancelled:   'CANCELLED',
  }

  for (const [oldStatus, newStatus] of Object.entries(mapping)) {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "jobs" SET status = CAST($1 AS "JobStatus") WHERE status::text = $2`,
      newStatus, oldStatus
    )
    console.log(`Migrated ${result} jobs from ${oldStatus} → ${newStatus}`)
  }

  const res = await prisma.$executeRaw`
    UPDATE "jobs" SET "agreed_salary" = salary_max
    WHERE status IN ('AGREED', 'IN_PROGRESS', 'COMPLETED')
      AND "agreed_salary" IS NULL
  `
  console.log(`Backfilled agreed_salary for ${res} jobs.`)
}

migrateJobStatuses()
  .then(() => console.log('Migration complete'))
  .catch(console.error)
  .finally(() => prisma.$disconnect())
