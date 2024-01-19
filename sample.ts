import { stripDebug } from './plugin';

Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './build',
  plugins: [stripDebug({ tsconfigPath: './cfg/tsconfig.json' })],
});
