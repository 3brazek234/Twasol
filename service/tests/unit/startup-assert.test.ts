import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prismaMock } from '../mocks/prisma';
import { assertDatabaseSchemaReady } from '../../src/common/utils/startup-assert';

describe('assertDatabaseSchemaReady startup assertion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails when the users.suspended_at column is missing', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([] as any);

    await expect(assertDatabaseSchemaReady()).rejects.toThrow(
      /column "users\.suspended_at" is missing/,
    );
  });

  it('fails when 20261107000001_seed_suspended_at has not finished in _prisma_migrations', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ column_name: 'suspended_at' }] as any)
      .mockResolvedValueOnce([] as any);

    await expect(assertDatabaseSchemaReady()).rejects.toThrow(
      /required migration "20261107000001_seed_suspended_at" has not finished/,
    );
  });

  it('resolves when both users.suspended_at column and finished seed migration exist', async () => {
    prismaMock.$queryRaw
      .mockResolvedValueOnce([{ column_name: 'suspended_at' }] as any)
      .mockResolvedValueOnce([
        { migration_name: '20261107000001_seed_suspended_at', finished_at: new Date() },
      ] as any);

    await expect(assertDatabaseSchemaReady()).resolves.toBeUndefined();
  });
});
