import type { BunPlugin } from 'bun';

import ts from 'typescript';

const stripPatterns = [/console\.\w?/, /debugger/];

function getScriptKind(filename: string): ts.ScriptKind {
  const ext = filename.split('.').pop() as string;

  switch (ext) {
    case 'jsx':
      return ts.ScriptKind.JSX;
    case 'tsx':
      return ts.ScriptKind.TSX;
    default:
      return ext.startsWith('js') ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  }
}

function flattenExpression(node: ts.CallExpression): string {
  const tokens: string[] = [];

  let expr = node.expression;
  while (expr && ts.isPropertyAccessExpression(expr)) {
    tokens.unshift(expr.name.escapedText.toString());

    expr = expr.expression;
  }

  if (ts.isIdentifier(expr)) {
    tokens.unshift(expr.escapedText.toString());
  }

  return tokens.join('.');
}

function stripDebuggers(source: ts.SourceFile) {
  const walk = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const flattened = flattenExpression(node);

      if (stripPatterns.some((pattern) => pattern.test(flattened))) {
        ts.updateSourceFile(
          source,
          '',
          ts.createTextChangeRange(
            ts.createTextSpan(node.pos, node.end - node.pos),
            node.end - node.pos
          )
        );
      }
    }

    ts.forEachChild(node, walk);
  };

  walk(source);
}

const plugin: BunPlugin = {
  name: 'strip',
  setup(build) {
    build.onLoad(
      { filter: /\.(js|ts|tsx|jsx|mjs|cjs|mts|cts)$/ },
      async ({ path }) => {
        const contents = await Bun.file(path).text();

        const sourceFile = ts.createSourceFile(
          '',
          contents,
          ts.ScriptTarget.ESNext,
          false,
          getScriptKind(path)
        );

        stripDebuggers(sourceFile);

        return {
          contents: sourceFile.getText(),
        };
      }
    );
  },
};
