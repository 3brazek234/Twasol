import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

export const registry = new OpenAPIRegistry();

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Lawyer Job Marketplace API',
      version: '1.0.0',
      description: 'Court-based lawyer job marketplace with real-time chat, salary negotiation, verification, and ratings.',
    },
    servers: [
      { url: '/api', description: 'API server' },
    ],
  });
}
