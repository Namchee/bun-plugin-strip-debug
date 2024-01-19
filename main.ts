import ts from 'typescript';

import { basename, resolve } from 'node:path';

export interface PluginConfig {
  tsconfigPath?: string;
  debugger?: boolean;
  exclude?: string[];
}

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

function flattenExpression(node: ts.CallExpression): string[] {
  const tokens: string[] = [];

  let expr: ts.Expression = node.expression;
  while (expr) {
    switch (expr.kind) {
      case ts.SyntaxKind.PropertyAccessExpression: {
        tokens.unshift(
          (expr as ts.PropertyAccessExpression).name.escapedText.toString()
        );
        break;
      }
      case ts.SyntaxKind.ElementAccessExpression:
        const elementExpr = expr as ts.ElementAccessExpression;
        if (ts.isStringLiteral(elementExpr.argumentExpression)) {
          tokens.unshift(
            (elementExpr.argumentExpression as ts.StringLiteral).text
          );
        }
    }

    if ('expression' in expr) {
      expr = expr.expression as ts.Expression;
    } else {
      break;
    }
  }

  if (ts.isIdentifier(expr)) {
    tokens.unshift(expr.escapedText.toString());
  }

  return tokens;
}

function isCallStatement(node: ts.Node): node is ts.ExpressionStatement {
  return ts.isExpressionStatement(node) && ts.isCallExpression(node.expression);
}

function shouldStrip(flatExpr: string[], config: PluginConfig): boolean {
  if (flatExpr[0] !== 'console') {
    return false;
  }

  return config.exclude ? !config.exclude.includes(flatExpr[1]) : true;
}

function createStripTransformer(
  config: PluginConfig
): ts.TransformerFactory<ts.SourceFile> {
  return (ctx: ts.TransformationContext) => {
    return (source: ts.SourceFile) => {
      const walk = (node: ts.Node) => {
        if (isCallStatement(node)) {
          const callExpr = node.expression as ts.CallExpression;
          const flattened = flattenExpression(callExpr);

          return shouldStrip(flattened, config)
            ? ctx.factory.createIdentifier('')
            : node;
        }

        if (ts.isDebuggerStatement(node)) {
          return config.debugger ? ctx.factory.createIdentifier('') : node;
        }

        return ts.visitEachChild(node, walk, ctx);
      };

      return ts.visitNode(source, walk) as ts.SourceFile;
    };
  };
}

async function getCompilerOptions(
  sourcePath?: string
): Promise<ts.CompilerOptions> {
  try {
    const path = resolve(process.cwd(), sourcePath ?? './tsconfig.json');
    const text = await Bun.file(path).text();
    const result = ts.parseConfigFileTextToJson('', text);

    return ts.convertCompilerOptionsFromJson(result.config.compilerOptions, '')
      .options;
  } catch (err) {
    return ts.getDefaultCompilerOptions();
  }
}

export async function stripDebuggers(
  text: string,
  path: string,
  config: PluginConfig
): Promise<string> {
  const compilerOptions = await getCompilerOptions(config.tsconfigPath);

  const sourceFile = ts.createSourceFile(
    basename(path),
    text,
    compilerOptions.target || ts.ScriptTarget.ESNext,
    false,
    getScriptKind(path)
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    omitTrailingSemicolon: true,
  });

  const stripTransformer = createStripTransformer(config);

  const transformer = ts.transform(
    sourceFile,
    [stripTransformer],
    compilerOptions
  );
  return printer.printNode(
    ts.EmitHint.Unspecified,
    transformer.transformed[0],
    sourceFile
  );
}
