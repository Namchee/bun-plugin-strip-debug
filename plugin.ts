import type { BunPlugin } from 'bun';

import { PluginConfig, stripDebuggers } from './main';

// filter out non-test files
const filePattern =
  /^(?!.*\.(spec|test)\.(js|ts|tsx|jsx|mjs|cjs|mts|cts)$).*\.(js|ts|tsx|jsx|mjs|cjs|mts|cts)$/;

export function stripDebug(config: PluginConfig): BunPlugin {
  return {
    name: 'strip',
    setup(build) {
      build.onLoad(
        {
          filter: filePattern,
        },
        async ({ path }) => {
          const contents = await Bun.file(path).text();
          const postProcessed = stripDebuggers(contents, path, config);

          return {
            contents: postProcessed,
          };
        }
      );
    },
  };
}
