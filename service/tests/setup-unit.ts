import { vi } from "vitest";
import { prismaMock } from "./mocks/prisma";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

vi.mock('../src/prisma', () => ({
  __esModule: true,
  default: prismaMock,
  prisma: prismaMock,
}));

vi.mock('ioredis', () => {
  const Redis = vi.fn();
  Redis.prototype.on = vi.fn();
  Redis.prototype.connect = vi.fn();
  return { default: Redis, __esModule: true };
});

vi.mock('bullmq', () => {
  const Worker = vi.fn(() => ({
    on: vi.fn(),
  }));
  const Queue = vi.fn(() => ({
    add: vi.fn(),
  }));
  return { Worker, Queue, __esModule: true };
});
