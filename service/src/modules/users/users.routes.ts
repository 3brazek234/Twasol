import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { UsersController } from './users.controller';
import { updateProfileSchema, updateAccountModeSchema } from './users.schema';
import { z } from 'zod';


const router = Router();

const userIdParamsSchema = z.object({ id: z.string().uuid() });

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const data = await UsersController.getProfile({ ...req, params: { id: req.user!.userId } } as any, res, next);
  } catch (err) {
    next(err);
  }
});
router.patch('/me', authenticate, validate(updateProfileSchema, 'body'), UsersController.updateProfile);
router.delete('/me', authenticate, UsersController.deleteAccount);
router.patch('/me/account-mode', authenticate, validate(updateAccountModeSchema, 'body'), UsersController.updateAccountMode);
router.post('/push-token', authenticate, UsersController.savePushToken);
router.get('/:id/profile', authenticate, validate(userIdParamsSchema, 'params'), UsersController.getProfile);

export default router;
