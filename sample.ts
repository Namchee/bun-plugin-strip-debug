import { stripDebug } from './plugin';

Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './build',
  plugins: [stripDebug()],
});
