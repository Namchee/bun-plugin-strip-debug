# bun-plugin-strip-console

Strip `console.*` and `debugger` statements from your `Bun.build` output.

## Usage

```ts
import { stripDebug } from '@namchee/bun-plugin-strip-console';

Bun.build({
  entrypoints: ['<your_entrypoint>'],
  outdir: '<your_outdir>',
  plugins: [stripDebug()],
});

```

## Options

| Name | Default | Description |
| ---- | ------- | ----------- |
| foo  |         |             |

## Task List

- [x] Working PoC
- [x] Configuration system
- [x] Faithful to directory's `tsconfig.json`

## License

This project is licensed under the [MIT License](./LICENSE)