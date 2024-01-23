# @namchee/bun-plugin-strip-debug

A Bun plugin that strips `console.*` and `debugger` statements from your `Bun.build` output.

## Example

Given the following code:

```ts
console.log('Hello World!');

function add(a: number, b: number): number {
    debugger;
    return a + b;
}

console['table']({ foo: 'bar' });
```

This transformer will transform your code to the following code:

```ts
function add(a: number, b: number): number {
    return a + b;
}
```

## Installation

```bash
# Using npm
npm install -D @namchee/bun-plugin-strip-debug

# Using yarn
yarn add -D @namchee/bun-plugin-strip-debug

# Using pnpm
pnpm install -D @namchee/bun-plugin-strip-debug

# Using bun
bun install -D @namchee/bun-plugin-strip-debug
```

## Usage

```ts
import { stripDebug } from '@namchee/bun-plugin-strip-debug';

Bun.build({
  entrypoints: ['<your_entrypoint>'],
  outdir: '<your_outdir>',
  plugins: [stripDebug()],
});

```

See [sample](./sample/build.ts) for complete example.

## Options

| Name           | Type       | Default                                                                           | Description                                                                                |
| -------------- | ---------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `files`        | `RegExp`   | All JS and TS files in the project directory, including the e**X**tended variants | List of files to be processed by the plugin                                                |
| `exclude`      | `string[]` | `[]`                                                                              | List of console methods to ignore when stripping console statements.                       |
| `debugger`     | `boolean`  | `true`                                                                            | Allows the plugin to strip debugger statements.                                            |
| `tsconfigPath` | `string`   | `process.cwd()/tsconfig.json`, if not found will use `{ target: "es2015" }`       | Path to TypeScript configuration file. Will be used for code traversal and transformation. |

## License

This project is licensed under the [MIT License](./LICENSE)