import type { BunPlugin } from 'bun';
import ts from 'typescript';

import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

import { stripDebug as stripDebugFn } from '@namchee/henshin-strip-debug';

// filter out non-test files
const filePattern =
  /^(?!.*.(spec|test).(js|ts|tsx|jsx|mjs|cjs|mts|cts)$).*.(js|ts|tsx|jsx|mjs|cjs|mts|cts)$/;

// Plugin configuration
export interface PluginConfig {
  /**
   * List of source files that should be processed
   */
  files?: RegExp;
  /**
   * `console` methods that shouldn't be stripped when processing a source file
   */
  exclude?: string[];
  /**
   * Allows the debugger statement to be stripped
   */
  debugger?: boolean;
  /**
   * Path to `tsconfig.json`
   */
  tsconfigPath?: string;
}

function getCompilerOptions(sourcePath: string): ts.CompilerOptions {
  try {
    // need a sync version of this in Bun API
    const content = readFileSync(sourcePath).toString();
    const result = ts.parseConfigFileTextToJson('', content);

    return ts.convertCompilerOptionsFromJson(result.config.compilerOptions, '')
      .options;
  } catch (err) {
    return ts.getDefaultCompilerOptions();
  }
}

/**
 * Factory function for `strip-debug` plugin.
 *
 * @param {PluginConfig} config Plugin configuration
 * @param {RegExp} config.files List of source files that should be processed
 * @param {string[]} config.exclude `console` methods that shouldn't be stripped when processing a source file
 * @param {boolean} config.debugger Allows the debugger statement to be stripped
 * @param {string} config.tsconfigPath Path to `tsconfig.json`
 * @returns {BunPlugin} `Bun.build` plugin that strips debugging statements from
 * source files.
 */
export function stripDebug(
  config: PluginConfig = {
    exclude: [],
    debugger: true,
  }
): BunPlugin {
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
          filter,
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
