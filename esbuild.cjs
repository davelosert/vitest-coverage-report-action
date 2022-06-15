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
    'rollup',
    'fsevents',
  ]
}).catch(() => process.exit(1));
