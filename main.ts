import ts from 'typescript';

const stripPatterns = [/console\.\w?/, /assert\.\w?/];

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

function isCallStatement(node: ts.Node): node is ts.ExpressionStatement {
  return ts.isExpressionStatement(node) && ts.isCallExpression(node.expression);
}

const stripTransformer: ts.TransformerFactory<ts.SourceFile> = (
  ctx: ts.TransformationContext
) => {
  return (source: ts.SourceFile) => {
    const walk = (node: ts.Node) => {
      if (isCallStatement(node)) {
        const callExpr = node.expression as ts.CallExpression;
        const flattened = flattenExpression(callExpr);

        return stripPatterns.some((pattern) => pattern.test(flattened))
          ? ctx.factory.createIdentifier('')
          : node;
      }

      if (ts.isDebuggerStatement(node)) {
        return ctx.factory.createIdentifier('');
      }

      return ts.visitEachChild(node, walk, ctx);
    };

    return ts.visitNode(source, walk) as ts.SourceFile;
  };
};

export function stripDebuggers(text: string, path: string): string {
  const sourceFile = ts.createSourceFile(
    '',
    text,
    ts.ScriptTarget.ESNext,
    false,
    getScriptKind(path)
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    omitTrailingSemicolon: true,
  });

  const transformer = ts.transform(sourceFile, [stripTransformer]);
  return printer.printNode(
    ts.EmitHint.Unspecified,
    transformer.transformed[0],
    sourceFile
  );
}
