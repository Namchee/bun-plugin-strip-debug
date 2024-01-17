import ts from 'typescript';

import { basename } from 'node:path';

export interface PluginConfig {
  tsconfigPath?: string;
  debugger?: boolean;
  exclude?: string[];
}

interface CompilerOptions {
  target: ts.ScriptTarget.ES5;
}

const targetMap = {};

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

  let expr = node.expression;
  while (expr && ts.isPropertyAccessExpression(expr)) {
    tokens.unshift(expr.name.escapedText.toString());

    expr = expr.expression;
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
    const path = Bun.resolveSync(
      sourcePath || './tsconfig.json',
      process.cwd()
    );
    console.log(path);
    const text = await Bun.file(path).text();

    return ts.convertCompilerOptionsFromJson(
      undefined,
      process.cwd(),
      sourcePath
    ).options;
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
  console.log(compilerOptions);

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
