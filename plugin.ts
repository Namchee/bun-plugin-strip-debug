import type { BunPlugin } from 'bun';
import ts from 'typescript';

import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

import { stripDebug as stripDebugFn } from '@namchee/henshin-strip-debug';

// filter out non-test files
const filePattern =
  '^(?!.*.(spec|test).(js|ts|tsx|jsx|mjs|cjs|mts|cts)$).*.(js|ts|tsx|jsx|mjs|cjs|mts|cts)$';

interface PluginConfig {
  files?: string;
  exclude?: string[];
  debugger?: boolean;
  tsconfigPath?: string;
}

function getCompilerOptions(sourcePath: string): ts.CompilerOptions {
  try {
    const content = readFileSync(sourcePath).toString();
    const result = ts.parseConfigFileTextToJson('', content);

    return ts.convertCompilerOptionsFromJson(result.config.compilerOptions, '')
      .options;
  } catch (err) {
    return ts.getDefaultCompilerOptions();
  }
}

export function stripDebug(config: PluginConfig = {}): BunPlugin {
  const filter = config.files ?? filePattern;
  const tsconfigPath =
    config.tsconfigPath ?? resolve(process.cwd(), './tsconfig.json');

  const pluginCfg = {
    exclude: config.exclude,
    debugger: config.debugger,
    compilerOptions: getCompilerOptions(tsconfigPath),
  };

  return {
    name: 'strip-debug',
    setup(build) {
      build.onLoad(
        {
          filter: new RegExp(filter),
        },
        async ({ path }) => {
          const content = await Bun.file(path).text();
          const postProcessed = stripDebugFn(content, pluginCfg, path);

          return {
            contents: postProcessed,
          };
        }
      );
    },
  };
}
