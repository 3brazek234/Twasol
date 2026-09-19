import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { z } from 'zod';
import { prisma } from '../../prisma';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  criteria: z.record(z.any()),
});

router.post('/', authenticate, validate(createSchema, 'body'), async (req: any, res) => {
  const { name, criteria } = req.body;
  const search = await prisma.savedSearch.create({
    data: {
      userId: req.user.userId,
      name,
      courtId: criteria.courtId || null,
      taskType: criteria.taskType || null,
      query: criteria.q || null,
    }
  });
  // Return it in the format the app expects
  const formatted = {
    ...search,
    criteria: {
      courtId: search.courtId,
      taskType: search.taskType,
      q: search.query,
    }
  };
  res.json({ success: true, data: formatted });
});

router.get('/', authenticate, async (req: any, res) => {
  const searches = await prisma.savedSearch.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' }
  });
  
  const formatted = searches.map(s => ({
    ...s,
    criteria: {
      courtId: s.courtId,
      taskType: s.taskType,
      q: s.query,
    }
  }));

  res.json({ success: true, data: formatted });
});

router.delete('/:id', authenticate, async (req: any, res) => {
  await prisma.savedSearch.deleteMany({
    where: { 
      id: req.params.id,
      userId: req.user.userId 
    }
  });
  res.json({ success: true });
});

export default router;
