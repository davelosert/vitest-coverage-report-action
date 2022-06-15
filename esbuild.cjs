const { build } = require('esbuild');
build({
    bundle: true,
    minify: true,
    sourcemap: 'external',
    platform: 'node',
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    target: 'node16',
  external: [
    'vite/dist/client/client.mjs',
    'rollup',
    'fsevents',
    'vite/dist/client/env.mjs'
  ]
}).catch(() => process.exit(1));
