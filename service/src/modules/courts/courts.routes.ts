import { Router } from 'express';
import { CourtsController } from './courts.controller';
import { authenticate } from '../../common/middleware/authenticate';
import { authorize } from '../../common/middleware/authorize';
import { validate } from '../../common/middleware/validate';
import { createCourtSchema, listCourtsSchema, courtIdParamSchema, registerLawyerSchema, searchCourtsSchema } from './courts.schema';

const router = Router();

router.get('/governorates', CourtsController.getGovernorates);
router.get('/search', authenticate, validate(searchCourtsSchema, 'query'), CourtsController.search);
router.get('/my', authenticate, CourtsController.getMyCourts);
router.get('/', authenticate, validate(listCourtsSchema, 'query'), CourtsController.list);
router.get('/:id', authenticate, validate(courtIdParamSchema, 'params'), CourtsController.getById);
router.get('/:id/lawyers', authenticate, validate(courtIdParamSchema, 'params'), CourtsController.getLawyers);
router.post('/register', authenticate, validate(registerLawyerSchema, 'body'), CourtsController.registerLawyer);
router.delete('/:id/deactivate', authenticate, validate(courtIdParamSchema, 'params'), CourtsController.deactivateLawyer);
router.post('/', authenticate, authorize('ADMIN'), validate(createCourtSchema, 'body'), CourtsController.create);

export default router;
