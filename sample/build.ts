import { stripDebug } from '../plugin';

Bun.build({
  entrypoints: ['./sample/index.ts', './sample/foo.ts'],
  outdir: './build',
  plugins: [stripDebug({ exclude: ['error', 'table'], files: /foo/ })],
});
