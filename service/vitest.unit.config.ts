import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    tsconfigRaw: JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
      },
    }),
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup-unit.ts'],
  },
});
