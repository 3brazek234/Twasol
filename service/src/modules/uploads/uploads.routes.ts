import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { UploadsController } from './uploads.controller';
import { presignedUrlSchema } from './uploads.schema';

const router = Router();

router.post('/presigned-url', authenticate, validate(presignedUrlSchema, 'body'), UploadsController.getPresignedUrl);

export { router as uploadsRouter };
