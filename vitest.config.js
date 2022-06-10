import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      all: true,
      reporter: ['text', 'json-summary'],
      include: ['src'],
      exclude: ['src/types'],
      branches: 80,
      lines: 80,
      statements: 80,
      functions: 80
    }
  }
});
