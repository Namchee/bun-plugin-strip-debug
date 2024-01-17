import type { BunPlugin } from 'bun';

import { PluginConfig, stripDebuggers } from './main';

// filter out non-test files
const filePattern =
  /^(?!.*\.(spec|test)\.(js|ts|tsx|jsx|mjs|cjs|mts|cts)$).*\.(js|ts|tsx|jsx|mjs|cjs|mts|cts)$/;

export function stripDebug(
  config: PluginConfig = {
    exclude: [],
    debugger: true,
    tsconfigPath: './tsconfig.json',
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
          const contents = await Bun.file(path).text();
          const postProcessed = await stripDebuggers(contents, path, config);

          return {
            contents: postProcessed,
          };
        }
      );
    },
  };
}
