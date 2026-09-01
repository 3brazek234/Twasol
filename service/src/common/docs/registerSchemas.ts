import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from './openapi';

// Extend Zod with OpenAPI metadata
extendZodWithOpenApi(z);

// Register reusable schemas
registry.register('TokenResponse', z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
}).openapi('TokenResponse'));

registry.register('ErrorResponse', z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
}).openapi('ErrorResponse'));

registry.register('PaginationMeta', z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
}).openapi('PaginationMeta'));

// Register API paths for auth
registry.registerPath({
  method: 'post',
  path: '/auth/register',
  summary: 'Register a new user',
  tags: ['Auth'],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({
        fullName: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
        barNumber: z.string().optional(),
      }).openapi('RegisterRequest') } },
    },
  },
  responses: { 201: { description: 'User registered successfully' } },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  summary: 'Login with email and password',
  tags: ['Auth'],
  request: {
    body: {
      content: { 'application/json': { schema: z.object({
        email: z.string().email(),
        password: z.string(),
      }).openapi('LoginRequest') } },
    },
  },
  responses: { 200: { description: 'Login successful' } },
});

registry.registerPath({
  method: 'get',
  path: '/courts',
  summary: 'List courts',
  tags: ['Courts'],
  responses: { 200: { description: 'Paginated list of courts' } },
});

registry.registerPath({
  method: 'post',
  path: '/jobs',
  summary: 'Create a new job',
  tags: ['Jobs'],
  responses: { 201: { description: 'Job created' } },
});

registry.registerPath({
  method: 'get',
  path: '/jobs',
  summary: 'List jobs',
  tags: ['Jobs'],
  responses: { 200: { description: 'Paginated list of jobs' } },
});

registry.registerPath({
  method: 'post',
  path: '/jobs/{id}/apply',
  summary: 'Apply to a job',
  tags: ['Jobs'],
  responses: { 200: { description: 'Application submitted' } },
});

registry.registerPath({
  method: 'post',
  path: '/jobs/{id}/reviews',
  summary: 'Submit a review for a completed job',
  tags: ['Reviews'],
  responses: { 201: { description: 'Review created' } },
});

registry.registerPath({
  method: 'get',
  path: '/users/{id}/reviews',
  summary: 'Get reviews for a user',
  tags: ['Reviews'],
  responses: { 200: { description: 'Paginated list of reviews' } },
});

registry.registerPath({
  method: 'get',
  path: '/users/{id}/profile',
  summary: 'Get user profile with average rating',
  tags: ['Users'],
  responses: { 200: { description: 'User profile' } },
});

registry.registerPath({
  method: 'post',
  path: '/verification/submit',
  summary: 'Submit verification document',
  tags: ['Verification'],
  responses: { 201: { description: 'Document submitted' } },
});

registry.registerPath({
  method: 'get',
  path: '/verification/status',
  summary: 'Check verification status',
  tags: ['Verification'],
  responses: { 200: { description: 'Verification status' } },
});

registry.registerPath({
  method: 'get',
  path: '/notifications',
  summary: 'List notifications',
  tags: ['Notifications'],
  responses: { 200: { description: 'Paginated notifications' } },
});

export {}; // ensure this file is treated as a module
