await Bun.build({
  entrypoints: ['./plugin.ts'],
  outdir: './dist',
  target: 'bun',
  minify: true,
  external: ['typescript'],
});
export { };

