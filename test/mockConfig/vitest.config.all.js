import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      all: true,
      reporter: ['text', 'json-summary'],
      include: ['src'],
      exclude: ['src/types'],
      lines: 60,
      branches: 70,
      functions: 80,
      statements: 90
    }
  }
});
