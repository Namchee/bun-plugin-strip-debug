import ts from 'typescript';

const stripPatterns = [/console\.\w?/];

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  omitTrailingSemicolon: true,
});

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

const stripTransformer: ts.TransformerFactory<ts.SourceFile> = (
  ctx: ts.TransformationContext
) => {
  return (source: ts.SourceFile) => {
    const walk = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const flattened = flattenExpression(node);

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

function stripOrphanedSemicolons(output: string) {}

(() => {
  const source = ts.createSourceFile(
    '',
    `const a = 'Hello World';
const b = 'c'; console.log('aaa'); console.table({ foo: 'bar' });
console.log('cccccccc');`,
    ts.ScriptTarget.ES2015,
    false,
    ts.ScriptKind.TS
  );

  const result = ts.transform(source, [stripTransformer]);
  const transformed = printer.printNode(
    ts.EmitHint.Unspecified,
    result.transformed[0],
    source
  );

  console.log(transformed);
})();
