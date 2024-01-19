import type { BunPlugin } from 'bun';

import { resolve } from 'node:path';

import { PluginConfig, stripDebuggers } from './main';

// filter out non-test files
const filePattern =
  /^(?!.*\.(spec|test)\.(js|ts|tsx|jsx|mjs|cjs|mts|cts)$).*\.(js|ts|tsx|jsx|mjs|cjs|mts|cts)$/;

export function stripDebug(
  config: PluginConfig = {
    exclude: [],
    debugger: true,
    tsconfigPath: resolve(process.cwd(), './tsconfig.json'),
  }
): BunPlugin {
  return {
    name: 'strip-console',
    setup(build) {
      build.onLoad(
        {
          filter: filePattern,
        },
        async ({ path }) => {
          const content = await Bun.file(path).text();
          const postProcessed = await stripDebuggers(content, path, config);

          return {
            contents: postProcessed,
          };
        }
      );
    },
  };
}
