import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { LawyersController } from './lawyers.controller';
import { searchLawyersSchema, lawyerIdParamSchema } from './lawyers.schema';

const router = Router();

router.get('/search', authenticate, validate(searchLawyersSchema, 'query'), LawyersController.search);
router.get('/:id/profile', authenticate, validate(lawyerIdParamSchema, 'params'), LawyersController.getProfile);

export { router as lawyersRouter };
