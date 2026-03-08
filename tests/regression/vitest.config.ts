import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/regression/**/*.spec.ts'],
    reporters: ['default', 'html'],
    outputFile: {
      html: 'regression-report/index.html',
      json: 'regression-report/results.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'apps/web/',
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
