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
      criteria,
    }
  });
  res.json({ success: true, data: search });
});

router.get('/', authenticate, async (req: any, res) => {
  const searches = await prisma.savedSearch.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: searches });
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
