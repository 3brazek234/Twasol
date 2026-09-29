import { Router } from 'express';
import { authenticate } from '../../common/middleware/authenticate';
import { validate } from '../../common/middleware/validate';
import { reviewLimiter } from '../../common/middleware/rateLimiter';
import { ReviewsController } from './reviews.controller';
import { createReviewParamsSchema, createReviewBodySchema, getUserReviewsParamsSchema, getUserReviewsQuerySchema } from './reviews.schema';

const router = Router();

// These routes will be mounted differently:
// POST /api/jobs/:id/reviews and GET /api/users/:id/reviews
// So we export the handlers to be used in app.ts or a combined router

export const jobReviewsRouter = Router({ mergeParams: true });
jobReviewsRouter.post('/', authenticate, reviewLimiter, validate(createReviewParamsSchema, 'params'), validate(createReviewBodySchema, 'body'), ReviewsController.create);

export const userReviewsRouter = Router({ mergeParams: true });
userReviewsRouter.get('/', authenticate, validate(getUserReviewsParamsSchema, 'params'), validate(getUserReviewsQuerySchema, 'query'), ReviewsController.getUserReviews);
userReviewsRouter.get('/stats', authenticate, ReviewsController.getUserStats);

export default router;
