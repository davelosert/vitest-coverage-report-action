import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      all: true,
      reporter: ['text', 'json-summary', 'json'],
      include: ['src'],
      exclude: ['src/types'],
      lines: 60,
      functions: 60,
      statements: 60,
      branches: 60
    }
  }
});
