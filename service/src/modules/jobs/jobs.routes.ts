import { Router } from 'express';
import { JobsController } from './jobs.controller';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { jobPostLimiter } from '../../common/middleware/rateLimiter';
import { 
  createJobSchema, 
  listJobsSchema, 
  jobIdParamSchema, 
  updateJobStatusSchema 
} from './jobs.schema';

const router = Router();

router.post('/', authenticate, jobPostLimiter, validate(createJobSchema, 'body'), JobsController.create);
router.get('/', authenticate, validate(listJobsSchema, 'query'), JobsController.list);
router.get('/mine', authenticate, JobsController.getMyJobs);
router.get('/:id', authenticate, validate(jobIdParamSchema, 'params'), JobsController.getById);
router.post('/:id/apply', authenticate, validate(jobIdParamSchema, 'params'), JobsController.apply);
router.patch('/:id/status', authenticate, validate(jobIdParamSchema, 'params'), validate(updateJobStatusSchema, 'body'), JobsController.updateStatus);
router.post('/:id/translate', authenticate, validate(jobIdParamSchema, 'params'), JobsController.translate);

export default router;
