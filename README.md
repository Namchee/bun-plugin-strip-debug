# @namchee/bun-plugin-strip-debug

Strip `console.*` and `debugger` statements from your `Bun.build` output.

## Usage

```ts
import { stripDebug } from '@namchee/bun-plugin-strip-debug';

Bun.build({
  entrypoints: ['<your_entrypoint>'],
  outdir: '<your_outdir>',
  plugins: [stripDebug()],
});

```

## Options

| Name | Default | Description |
| ---- | ------- | ----------- |
| files  | All JS and TS files in the project directory, including the e**X**tended variants | List of files to be processed by the plugin |

## Task List

- [x] Working PoC
- [x] Configuration system
- [x] Faithful to directory's `tsconfig.json`

## License

This project is licensed under the [MIT License](./LICENSE)