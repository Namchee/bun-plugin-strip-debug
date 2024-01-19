import { stripDebug } from '../plugin';

Bun.build({
  entrypoints: ['./sample/index.ts'],
  outdir: './build',
  plugins: [stripDebug({ exclude: ['log'] })],
});
