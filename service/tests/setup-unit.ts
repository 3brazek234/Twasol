import { vi } from "vitest";
import { prismaMock } from "./mocks/prisma";

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
